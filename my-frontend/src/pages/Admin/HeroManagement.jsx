import React, { useEffect, useState } from 'react';
import { fetchAllBanners, createBanner, updateBanner, deleteBanner } from '../../services/hero';
import { fetchCategories } from '../../services/categories';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash, Eye, EyeOff, MoveUp, MoveDown } from 'lucide-react';

export default function HeroManagement() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category_id: '',
    button_text: 'Explore Now',
    button_link: '',
    display_order: 0,
    start_date: '',
    end_date: '',
    is_active: true
  });
  const [desktopImage, setDesktopImage] = useState(null);
  const [mobileImage, setMobileImage] = useState(null);
  const [previews, setPreviews] = useState({ desktop: null, mobile: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bannersRes, categoriesRes] = await Promise.all([
        fetchAllBanners(),
        fetchCategories()
      ]);
      setBanners(bannersRes.data.banners);
      setCategories(categoriesRes.data.categories);
    } catch (err) {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const handleImageChange = (type, file) => {
    if (file) {
      if (type === 'desktop') {
        setDesktopImage(file);
        setPreviews(p => ({ ...p, desktop: URL.createObjectURL(file) }));
      } else {
        setMobileImage(file);
        setPreviews(p => ({ ...p, mobile: URL.createObjectURL(file) }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '' && formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });
    
    if (desktopImage) data.append('desktop_image', desktopImage);
    if (mobileImage) data.append('mobile_image', mobileImage);

    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, data);
        toast.success('Banner updated');
      } else {
        await createBanner(data);
        toast.success('Banner created');
      }
      closeModal();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await deleteBanner(id);
      toast.success('Banner deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const moveBanner = async (index, direction) => {
    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;
    
    // Swap
    [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];
    
    // Update orders
    try {
      await Promise.all([
        updateBanner(newBanners[index].id, { display_order: index }),
        updateBanner(newBanners[targetIndex].id, { display_order: targetIndex })
      ]);
      setBanners(newBanners);
    } catch (err) {
      toast.error('Failed to reorder');
    }
  };

  const openModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        description: banner.description || '',
        category_id: banner.category_id || '',
        button_text: banner.button_text,
        button_link: banner.button_link || '',
        display_order: banner.display_order,
        start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
        end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
        is_active: banner.is_active
      });
      setPreviews({
        desktop: banner.image_url,
        mobile: banner.mobile_image_url
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      category_id: '',
      button_text: 'Explore Now',
      button_link: '',
      display_order: 0,
      start_date: '',
      end_date: '',
      is_active: true
    });
    setDesktopImage(null);
    setMobileImage(null);
    setPreviews({ desktop: null, mobile: null });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hero Banner Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage homepage hero slides with category links
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add Banner
        </button>
      </div>

      {/* Banners List */}
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div 
              key={banner.id} 
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 ${
                banner.is_active ? 'border-transparent' : 'border-red-200 opacity-60'
              }`}
            >
              <div className="flex gap-4">
                {/* Image Preview */}
                <div className="w-48 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img 
                    src={banner.image_url} 
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {banner.title}
                        {!banner.is_active && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{banner.subtitle}</p>
                      {banner.category_name && (
                        <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Category: {banner.category_name}
                        </span>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveBanner(index, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                      >
                        <MoveUp size={16} />
                      </button>
                      <button
                        onClick={() => moveBanner(index, 'down')}
                        disabled={index === banners.length - 1}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                      >
                        <MoveDown size={16} />
                      </button>
                      <button
                        onClick={() => openModal(banner)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span>Order: {banner.display_order}</span>
                    {banner.start_date && (
                      <span>From: {new Date(banner.start_date).toLocaleDateString()}</span>
                    )}
                    {banner.end_date && (
                      <span>To: {new Date(banner.end_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingBanner ? 'Edit Banner' : 'Add Hero Banner'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Desktop Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Desktop Image * (1920x600 recommended)
                  </label>
                  <div className="flex gap-4">
                    {previews.desktop && (
                      <img src={previews.desktop} alt="Preview" className="w-40 h-24 object-cover rounded-lg" />
                    )}
                    <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500">
                      <span className="text-sm text-gray-500">Click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange('desktop', e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Mobile Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Image (optional, 800x600 recommended)
                  </label>
                  <div className="flex gap-4">
                    {previews.mobile && (
                      <img src={previews.mobile} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                    )}
                    <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500">
                      <span className="text-sm text-gray-500">Click to upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange('mobile', e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Category Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Link to Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => {
                      const catId = e.target.value;
                      const cat = categories.find(c => c.id == catId);
                      setFormData({
                        ...formData, 
                        category_id: catId,
                        button_link: cat ? `/category/${cat.slug}` : ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">None (Custom Link)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Button */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.button_text}
                      onChange={(e) => setFormData({...formData, button_text: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={formData.button_link}
                      onChange={(e) => setFormData({...formData, button_link: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Active */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
                  >
                    {editingBanner ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}