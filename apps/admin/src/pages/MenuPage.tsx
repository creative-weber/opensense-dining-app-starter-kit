import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import type { MenuCategory, MenuItem } from '../types';
import { Plus, Trash2, Archive, Eye, EyeOff, Pencil, Check, X, Upload } from 'lucide-react';

type DietType = 'vegetarian' | 'vegan' | 'non-veg';

type MenuItemForm = {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  dietType: DietType;
};

type MenuItemFormField = keyof Pick<MenuItemForm, 'categoryId' | 'name' | 'description' | 'price' | 'imageUrl' | 'dietType'>;
type MenuItemFormErrors = Partial<Record<MenuItemFormField, string>>;

const validateMenuItemForm = (values: MenuItemForm, categories: MenuCategory[]): MenuItemFormErrors => {
  const errors: MenuItemFormErrors = {};

  if (!values.categoryId) {
    errors.categoryId = 'Please choose a category.';
  } else if (!categories.some((category) => category.id === values.categoryId)) {
    errors.categoryId = 'Selected category is invalid.';
  }

  const name = values.name.trim();
  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (name.length > 80) {
    errors.name = 'Name must be 80 characters or fewer.';
  }

  const description = values.description.trim();
  if (description.length > 300) {
    errors.description = 'Description must be 300 characters or fewer.';
  }

  const priceText = values.price.trim();
  const parsedPrice = Number(priceText);
  if (!priceText) {
    errors.price = 'Price is required.';
  } else if (!Number.isFinite(parsedPrice)) {
    errors.price = 'Price must be a valid number.';
  } else if (parsedPrice <= 0) {
    errors.price = 'Price must be greater than 0.';
  }

  const imageUrl = values.imageUrl.trim();
  if (imageUrl) {
    // Allow data URLs (from file uploads) and http(s) URLs
    if (!imageUrl.startsWith('data:')) {
      try {
        const parsedUrl = new URL(imageUrl);
        const isHttpUrl = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
        if (!isHttpUrl) {
          errors.imageUrl = 'Image URL must start with http:// or https://.';
        }
      } catch {
        errors.imageUrl = 'Please enter a valid image URL.';
      }
    }
  }

  return errors;
};

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<MenuItemFormErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldCloseOnBackdropMouseUp = useRef(false);

  const [form, setForm] = useState<MenuItemForm>({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    dietType: 'vegetarian',
  });

  const loadData = async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        api.get<MenuCategory[]>('/admin/categories'),
        api.get<MenuItem[]>('/admin/items'),
      ]);
      setCategories(catRes.data);
      setItems(itemRes.data);
      if (!form.categoryId && catRes.data.length > 0) {
        setForm((f) => ({ ...f, categoryId: catRes.data[0].id }));
      }
    } catch (err: unknown) {
      handleApiError(err, { operation: 'fetch menu', page: 'MenuPage' });
    }
  };

  useEffect(() => { void loadData(); }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      await api.post('/admin/categories', { name: newCatName.trim() });
      setNewCatName('');
      handleSuccess('Category added successfully');
      await loadData();
    } catch (err: unknown) {
      handleApiError(err, { operation: 'add category', page: 'MenuPage' });
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      handleSuccess('Category deleted successfully');
      await loadData();
    } catch (err: unknown) {
      handleApiError(err, { operation: 'delete category', page: 'MenuPage' });
    }
  };

  const handleArchiveCategory = async (id: string) => {
    if (!confirm('Archive this category? It will be hidden from customers but items will be preserved.')) return;
    try {
      await api.patch(`/admin/categories/${id}/archive`, { archived: true });
      handleSuccess('Category archived successfully');
      await loadData();
    } catch (err: unknown) {
      handleApiError(err, { operation: 'archive category', page: 'MenuPage' });
    }
  };

  const handlePrepopulateCategories = async () => {
    try {
      await api.post('/admin/categories/prepopulate', {});
      handleSuccess('Categories added successfully');
      await loadData();
    } catch (err: unknown) {
      handleApiError(err, { operation: 'prepopulate categories', page: 'MenuPage' });
    }
  };

  const openAddItem = () => {
    setEditItem(null);
    setForm({ categoryId: categories[0]?.id ?? '', name: '', description: '', price: '', imageUrl: '', dietType: 'vegetarian' });
    setImagePreview(null);
    setFormErrors({});
    setShowItemForm(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      categoryId: item.category_id,
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      imageUrl: item.image_url ?? '',
      dietType: item.is_vegan ? 'vegan' : item.is_vegetarian ? 'vegetarian' : 'non-veg',
    });
    setImagePreview(item.image_url ?? null);
    setFormErrors({});
    setShowItemForm(true);
  };

  const closeItemForm = () => {
    setShowItemForm(false);
    setFormErrors({});
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setForm((f) => ({ ...f, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateMenuItemForm(form, categories);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const payload = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: parseFloat(form.price),
      imageUrl: form.imageUrl.trim() || undefined,
      isVegetarian: form.dietType === 'vegetarian' || form.dietType === 'vegan',
      isVegan: form.dietType === 'vegan',
    };
    try {
      if (editItem) {
        await api.patch(`/admin/items/${editItem.id}`, payload);
        handleSuccess('Item updated successfully');
      } else {
        await api.post('/admin/items', payload);
        handleSuccess('Item added successfully');
      }
      closeItemForm();
      await loadData();
    } catch (err: unknown) {
      handleApiError(err, { operation: editItem ? 'update item' : 'add item', page: 'MenuPage' });
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await api.patch(`/admin/items/${item.id}`, { isAvailable: !item.is_available });
      await loadData();
    } catch (err: unknown) {
      handleApiError(err, { operation: 'update item', page: 'MenuPage' });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/admin/items/${id}`);
      handleSuccess('Item deleted successfully');
      await loadData();
    } catch (err: unknown) {
      handleApiError(err, { operation: 'delete item', page: 'MenuPage' });
    }
  };

  const f = (field: keyof MenuItemForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in formErrors) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field as MenuItemFormField];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
        <button onClick={openAddItem}
          className="flex items-center gap-1.5 bg-brand text-white text-base font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-colors">
          <Plus className="w-4 h-4" aria-hidden="true" /> Add Item
        </button>
      </div>

      {error && (
        <p className="text-base text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Add category */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <h2 className="font-bold text-gray-900 mb-3">Categories</h2>
        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
          <input
            type="text" placeholder="New category name"
            value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 border border-border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button type="submit" disabled={addingCat}
            className="bg-brand text-white text-base font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors">
            {addingCat ? '…' : 'Add'}
          </button>
        </form>
        {categories.length === 0 && (
          <button onClick={handlePrepopulateCategories}
            className="mb-4 w-full text-center text-base font-medium text-brand hover:text-brand-dark transition-colors py-2.5 border border-dashed border-brand rounded-xl">
            Add Common Categories
          </button>
        )}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const hasItems = items.some((i) => i.category_id === cat.id);
            return (
              <div key={cat.id} className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-full px-3 py-1">
                <span className="text-base font-medium text-gray-700">{cat.name}</span>
                {hasItems ? (
                  <button
                    onClick={() => handleArchiveCategory(cat.id)}
                    aria-label={`Archive ${cat.name}`}
                    title="Category has items — archive instead of deleting"
                    className="text-muted hover:text-amber-500 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    aria-label={`Delete ${cat.name}`}
                    className="text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}
          {categories.length === 0 && <p className="text-base text-muted">No categories yet.</p>}
        </div>
      </div>

      {/* Items list grouped by category */}
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category_id === cat.id);
        return (
          <div key={cat.id} className="bg-white rounded-2xl border border-border p-4">
            <h2 className="font-bold text-gray-900 mb-3">{cat.name}</h2>
            {catItems.length === 0 && <p className="text-base text-muted">No items in this category.</p>}
            <div className="space-y-2">
              {catItems.map((item) => (
                <div key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    item.is_available ? 'border-border' : 'border-dashed border-gray-200 opacity-60'
                  }`}>
                  <div className={`w-2.5 h-2.5 rounded-sm border-2 flex-shrink-0 ${
                    item.is_vegan ? 'border-violet-500 bg-violet-400' :
                    item.is_vegetarian ? 'border-green-500 bg-green-400' :
                    'border-red-500 bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-base text-muted">₹{Number(item.price).toFixed(0)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleToggleAvailable(item)}
                      aria-label={item.is_available ? 'Mark unavailable' : 'Mark available'}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-muted hover:text-gray-700">
                      {item.is_available
                        ? <Eye className="w-4 h-4" aria-hidden="true" />
                        : <EyeOff className="w-4 h-4" aria-hidden="true" />}
                    </button>
                    <button onClick={() => openEditItem(item)} aria-label={`Edit ${item.name}`}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-muted hover:text-brand">
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} aria-label={`Delete ${item.name}`}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted hover:text-red-600">
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add / Edit item modal */}
      {showItemForm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onMouseDown={(e) => {
            shouldCloseOnBackdropMouseUp.current = e.target === e.currentTarget;
          }}
          onMouseUp={(e) => {
            if (shouldCloseOnBackdropMouseUp.current && e.target === e.currentTarget) {
              closeItemForm();
            }
            shouldCloseOnBackdropMouseUp.current = false;
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{editItem ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={closeItemForm} className="text-muted hover:text-gray-700" aria-label="Close menu item form">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label htmlFor="menu-item-category" className="block text-base font-medium text-gray-600 mb-1">Category</label>
                <select id="menu-item-category" value={form.categoryId} onChange={f('categoryId')}
                  aria-invalid={Boolean(formErrors.categoryId)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand ${formErrors.categoryId ? 'border-red-400' : 'border-border'}`}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {formErrors.categoryId && <p className="mt-1 text-sm text-red-600">{formErrors.categoryId}</p>}
              </div>
              <div>
                <label htmlFor="menu-item-name" className="block text-base font-medium text-gray-600 mb-1">Name *</label>
                <input id="menu-item-name" required type="text" value={form.name} onChange={f('name')}
                  aria-invalid={Boolean(formErrors.name)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand ${formErrors.name ? 'border-red-400' : 'border-border'}`} />
                {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="menu-item-description" className="block text-base font-medium text-gray-600 mb-1">Description</label>
                <textarea id="menu-item-description" value={form.description} onChange={f('description')} rows={2}
                  aria-invalid={Boolean(formErrors.description)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-base resize-none focus:outline-none focus:ring-2 focus:ring-brand ${formErrors.description ? 'border-red-400' : 'border-border'}`} />
                {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
              </div>
              <div>
                <label htmlFor="menu-item-price" className="block text-base font-medium text-gray-600 mb-1">Price (₹) *</label>
                <input id="menu-item-price" required type="number" min="0.01" step="0.01" value={form.price} onChange={f('price')}
                  aria-invalid={Boolean(formErrors.price)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand ${formErrors.price ? 'border-red-400' : 'border-border'}`} />
                {formErrors.price && <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-600 mb-2">Image</label>
                {imagePreview && (
                  <div className="mb-3 relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-border" />
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 border-2 border-dashed border-brand rounded-xl px-3 py-2.5 text-brand hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm font-medium">Upload Image</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  aria-label="Upload menu item image"
                />
                <input
                  id="menu-item-image-url"
                  type="url"
                  value={form.imageUrl}
                  onChange={f('imageUrl')}
                  placeholder="Or paste image URL…"
                  aria-invalid={Boolean(formErrors.imageUrl)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand ${formErrors.imageUrl ? 'border-red-400' : 'border-border'}`}
                />
                {formErrors.imageUrl && <p className="mt-1 text-sm text-red-600">{formErrors.imageUrl}</p>}
              </div>
              <div>
                <p className="block text-base font-medium text-gray-600 mb-2">Dietary Type</p>
                <div className="flex gap-3">
                  {(['vegetarian', 'vegan', 'non-veg'] as DietType[]).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer text-base">
                      <input
                        type="radio"
                        name="dietType"
                        value={type}
                        checked={form.dietType === type}
                        onChange={() => setForm((f) => ({ ...f, dietType: type }))}
                        className={type === 'vegan' ? 'accent-violet-500' : type === 'vegetarian' ? 'accent-green-500' : 'accent-red-500'}
                      />
                      <span className="font-medium capitalize">{type === 'non-veg' ? 'Non-Veg' : type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white font-semibold py-2.5 rounded-xl hover:bg-brand-dark transition-colors">
                  <Check className="w-4 h-4" aria-hidden="true" />
                  {editItem ? 'Save Changes' : 'Add Item'}
                </button>
                <button type="button" onClick={closeItemForm}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
