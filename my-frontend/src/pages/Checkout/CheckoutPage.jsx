import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  MapPin, Navigation, Home, Briefcase, Plus, 
  ChevronDown, ChevronUp, Truck, ShieldCheck, 
  Clock, CreditCard, Smartphone, Wallet, X, Loader2
} from 'lucide-react';
import './CheckoutPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Address type icons
const ADDRESS_TYPES = [
  { id: 'home', label: 'Home', icon: Home, color: '#2874f0' },
  { id: 'work', label: 'Work', icon: Briefcase, color: '#ff9f00' },
  { id: 'other', label: 'Other', icon: MapPin, color: '#388e3c' },
];

// Payment methods
const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone, subtext: 'Pay via any UPI app' },
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, subtext: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', icon: Wallet, subtext: 'All major banks' },
  { id: 'cod', label: 'Cash on Delivery', icon: Truck, subtext: 'Pay when you receive' },
];

// Initial empty address
const EMPTY_ADDRESS = {
  id: null,
  type: 'home',
  name: '',
  mobile: '',
  pincode: '',
  state: '',
  city: '',
  district: '',
  locality: '',
  buildingNo: '',
  floor: '',
  landmark: '',
  isDefault: false,
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const { cart, getCartTotal, clearCart } = useCart();

  // Address states
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  // Form states
  const [formData, setFormData] = useState(EMPTY_ADDRESS);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [isManualPincode, setIsManualPincode] = useState(false);
  
  // Payment states
  const [selectedPayment, setSelectedPayment] = useState('upi');
  
  // Order states
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Calculate totals
  const cartTotal = getCartTotal();
  const deliveryCharge = cartTotal > 500 ? 0 : 49;
  const securityDeposit = cart.reduce((sum, item) => 
    sum + (item.security_deposit || 0) * (item.quantity || 1), 0
  );
  const finalTotal = cartTotal + securityDeposit + deliveryCharge;

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && !orderSuccess) {
      navigate('/cart');
    }
  }, [cart, navigate, orderSuccess]);

  // Fetch saved addresses from API on mount
  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  // Fetch addresses from backend
  const fetchSavedAddresses = async () => {
    if (!token) {
      setLoadingAddresses(false);
      setShowAddressForm(true);
      return;
    }

    try {
      setLoadingAddresses(true);
      const response = await fetch(`${API_URL}/api/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();
      
      if (data.success && data.addresses) {
        const transformedAddresses = data.addresses.map(addr => ({
          id: addr.id,
          type: addr.type || 'home',
          name: addr.name,
          mobile: addr.mobile,
          pincode: addr.pincode,
          state: addr.state,
          city: addr.city,
          district: addr.district || '',
          locality: addr.locality,
          buildingNo: addr.building_no,
          floor: addr.floor || '',
          landmark: addr.landmark || '',
          isDefault: addr.isDefault
        }));

        setSavedAddresses(transformedAddresses);
        
        const defaultAddr = transformedAddresses.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (transformedAddresses.length > 0) {
          setSelectedAddressId(transformedAddresses[0].id);
        }

        setShowAddressForm(transformedAddresses.length === 0);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load saved addresses');
      setShowAddressForm(true);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Pre-fill user data if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.firstName || user.name || '',
        mobile: user.phone || user.mobile || '',
      }));
    }
  }, [user]);

  // Pincode auto-fetch - ONLY when manually entered
  const fetchPincodeDetails = useCallback(async (pincode) => {
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setPincodeError('Enter valid 6-digit pincode');
      return;
    }

    setPincodeLoading(true);
    setPincodeError('');

    try {
      const response = await fetch(`${API_URL}/api/addresses/pincode/${pincode}`);
      const data = await response.json();

      if (data.success && data.pincode) {
        setFormData(prev => ({
          ...prev,
          state: prev.state || data.pincode.state || '',
          city: prev.city || data.pincode.city || '',
          district: prev.district || data.pincode.district || data.pincode.area || '',
          locality: prev.locality || data.pincode.locality || data.pincode.area || '',
        }));
        toast.success('Location details fetched!');
      } else {
        setPincodeError('Invalid pincode or service not available');
      }
    } catch (error) {
      console.error('Pincode fetch error:', error);
      setPincodeError('Failed to fetch location details');
    } finally {
      setPincodeLoading(false);
    }
  }, []);

  // Handle pincode input with debounce - ONLY for manual entry
  useEffect(() => {
    if (isManualPincode && formData.pincode.length === 6) {
      const timer = setTimeout(() => {
        fetchPincodeDetails(formData.pincode);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.pincode, isManualPincode, fetchPincodeDetails]);

  // Handle pincode input change
  const handlePincodeChange = (e) => {
    const value = e.target.value;
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, pincode: value }));
      setPincodeError('');
      setIsManualPincode(true);
    }
  };

  // Get current location - Uses OpenStreetMap/Nominatim
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setIsManualPincode(false);
    toast.loading('Fetching your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
          );
          const data = await response.json();

          if (data && data.address) {
            const addr = data.address;
            
            const extractedPincode = addr.postcode || '';
            const cityValue = addr.city || addr.town || '';
            const districtValue = addr.county || addr.city_district || addr.district || addr.suburb || '';

            setFormData(prev => ({
              ...prev,
              pincode: extractedPincode,
              state: addr.state || '',
              city: cityValue,
              district: districtValue,
              locality: addr.suburb || addr.neighbourhood || '',
            }));

            if (extractedPincode && /^\d{6}$/.test(extractedPincode)) {
              try {
                const pincodeResponse = await fetch(`${API_URL}/api/addresses/pincode/${extractedPincode}`);
                const pincodeData = await pincodeResponse.json();
                if (pincodeData.success) {
                  setFormData(prev => ({
                    ...prev,
                    state: pincodeData.pincode.state || prev.state,
                    city: pincodeData.pincode.city || prev.city,
                    district: pincodeData.pincode.district || pincodeData.pincode.area || prev.district,
                  }));
                }
              } catch (e) {
                // Ignore errors
              }
            }

            toast.dismiss();
            toast.success('Location detected successfully!');
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          toast.dismiss();
          toast.error('Failed to fetch address details');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        toast.dismiss();
        toast.error('Unable to get your location. Please enable location access.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'pincode') {
      setPincodeError('');
    }
  };

  // Save address to backend API
  const saveAddress = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    console.log('Save button clicked', formData); // Debug log
    
    const missingFields = [];
    if (!formData.name?.trim()) missingFields.push('Full Name');
    if (!formData.mobile?.trim()) missingFields.push('Mobile Number');
    if (!formData.pincode?.trim()) missingFields.push('Pincode');
    if (!formData.state?.trim()) missingFields.push('State');
    if (!formData.city?.trim()) missingFields.push('City');
    if (!formData.locality?.trim()) missingFields.push('Locality/Area');
    if (!formData.buildingNo?.trim()) missingFields.push('Building/Flat Number');

    if (missingFields.length > 0) {
      toast.error(`Please fill: ${missingFields.join(', ')}`);
      return;
    }

    if (formData.mobile.length !== 10) {
      toast.error('Please enter valid 10-digit mobile number');
      return;
    }

    if (!token) {
      toast.error('Please login to save address');
      return;
    }

    toast.loading('Saving address...');

    try {
      const isEditing = !!editingAddress;
      const url = isEditing 
        ? `${API_URL}/api/addresses/${editingAddress.id}`
        : `${API_URL}/api/addresses`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        type: formData.type,
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        pincode: formData.pincode.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        district: formData.district?.trim() || formData.city.trim(),
        locality: formData.locality.trim(),
        building_no: formData.buildingNo.trim(),
        floor: formData.floor?.trim() || null,
        landmark: formData.landmark?.trim() || null,
        is_default: formData.isDefault
      };

      console.log('Sending payload:', payload); // Debug log

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save address: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success(isEditing ? 'Address updated' : 'Address saved');
        
        await fetchSavedAddresses();
        
        setShowAddressForm(false);
        setEditingAddress(null);
        setFormData(EMPTY_ADDRESS);
        setIsManualPincode(false);

        // Explicitly set the new ID so the UI knows to jump to the Payment checkout block automatically
        if (data.address && data.address.id) {
          setSelectedAddressId(data.address.id);
        }
      } else {
        throw new Error(data.message || 'Failed to save address');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Save address error:', error);
      toast.error(error.message || 'Failed to save address. Please try again.');
    }
  };

  // Edit address
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setFormData({
      ...address,
      buildingNo: address.buildingNo || address.building_no || '',
      district: address.district || '',
    });
    setIsManualPincode(false);
    setShowAddressForm(true);
  };

  // Delete address from backend
  const handleDeleteAddress = async (id) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Address removed');
        await fetchSavedAddresses();
        
        if (selectedAddressId === id) {
          setSelectedAddressId(null);
        }
      }
    } catch (error) {
      console.error('Delete address error:', error);
      toast.error('Failed to delete address');
    }
  };

  // Set address as default
  const handleSetDefault = async (id, e) => {
    e.stopPropagation();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/addresses/${id}/default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to set default');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Default address updated');
        await fetchSavedAddresses();
      }
    } catch (error) {
      console.error('Set default error:', error);
      toast.error('Failed to update default address');
    }
  };

  // Place order
  const placeOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }

    setPlacingOrder(true);
    
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: cart,
          selectedAddressId: selectedAddressId,
          paymentMethod: selectedPayment,
          deliveryCharge: deliveryCharge
        })
      });

      const data = await response.json();

      if (data.success) {
        setOrderSuccess(true);
        clearCart();
      } else {
        throw new Error(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Error placing order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Selected address details
  const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);

  // Order success view
  if (orderSuccess) {
    return (
      <div className="fk-checkout-success">
        <div className="success-content">
          <div className="success-icon">🎉</div>
          <h2>Order Placed Successfully!</h2>
          <p>Your order has been confirmed and will be delivered soon.</p>
          <div className="success-details">
            <p>Order ID: <strong>ORD{Date.now()}</strong></p>
            <p>Total Paid: <strong>₹{finalTotal}</strong></p>
          </div>
          <button onClick={() => navigate('/')} className="btn-continue">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fk-checkout-page">
      <div className="fk-checkout-container">
        {/* Header */}
        <div className="fk-checkout-header">
          <div className="fk-logo" onClick={() => navigate('/')}>
            EveryThingRental
          </div>
          <div className="fk-checkout-steps">
            <span className="active">1. Address</span>
            <span>→</span>
            <span className={selectedAddressId ? 'active' : ''}>2. Payment</span>
            <span>→</span>
            <span>3. Confirm</span>
          </div>
        </div>

        <div className="fk-checkout-layout">
          {/* Left Column - Address & Payment */}
          <div className="fk-checkout-left">
            
            {/* Delivery Address Section */}
            <div className="fk-section-card">
              <div className="fk-section-header">
                <div className="fk-section-title">
                  <span className="fk-section-number">1</span>
                  <div>
                    <h3>Delivery Address</h3>
                    {selectedAddress && (
                      <p className="fk-selected-summary">
                        {selectedAddress.name}, {selectedAddress.locality}, {selectedAddress.city}
                      </p>
                    )}
                  </div>
                </div>
                {!showAddressForm && savedAddresses.length > 0 && (
                  <button 
                    className="fk-btn-change"
                    onClick={() => setShowAddressForm(true)}
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Loading State */}
              {loadingAddresses && (
                <div className="fk-loading-addresses">
                  <Loader2 size={24} className="fk-spinner" />
                  <p>Loading your addresses...</p>
                </div>
              )}

              {/* Saved Addresses List */}
              {!loadingAddresses && !showAddressForm && savedAddresses.length > 0 && (
                <div className="fk-saved-addresses">
                  {savedAddresses.map(address => (
                    <div 
                      key={address.id}
                      className={`fk-address-card ${selectedAddressId === address.id ? 'selected' : ''}`}
                      onClick={() => setSelectedAddressId(address.id)}
                    >
                      <div className="fk-address-radio">
                        <div className={`fk-radio ${selectedAddressId === address.id ? 'checked' : ''}`} />
                      </div>
                      <div className="fk-address-content">
                        <div className="fk-address-type-badge" style={{ 
                          backgroundColor: ADDRESS_TYPES.find(t => t.id === address.type)?.color + '20',
                          color: ADDRESS_TYPES.find(t => t.id === address.type)?.color 
                        }}>
                          {ADDRESS_TYPES.find(t => t.id === address.type)?.label}
                          {address.isDefault && <span className="default-tag">DEFAULT</span>}
                        </div>
                        <h4>{address.name} <span>{address.mobile}</span></h4>
                        <p className="fk-address-full">
                          {address.buildingNo || address.building_no}
                          {address.floor && `, ${address.floor}`}, {address.locality}, 
                          {address.landmark && ` Near ${address.landmark},`} {address.city}, {address.state} - {address.pincode}
                        </p>
                        <div className="fk-address-actions">
                          <button onClick={(e) => { e.stopPropagation(); handleEditAddress(address); }}>
                            Edit
                          </button>
                          {!address.isDefault && (
                            <button onClick={(e) => handleSetDefault(address.id, e)}>
                              Set as Default
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteAddress(address.id); }}
                            className="fk-btn-danger"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    className="fk-add-address-btn"
                    onClick={() => {
                      setEditingAddress(null);
                      setFormData(EMPTY_ADDRESS);
                      setIsManualPincode(false);
                      setShowAddressForm(true);
                    }}
                  >
                    <Plus size={20} />
                    Add New Address
                  </button>
                </div>
              )}

              {/* Address Form */}
              {showAddressForm && (
                <form className="fk-address-form" onSubmit={saveAddress}>
                  {/* Address Type Selection */}
                  <div className="fk-address-type-selector">
                    <label>Address Type</label>
                    <div className="fk-type-options">
                      {ADDRESS_TYPES.map((type, index) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={`${type.id}-${index}`}
                            type="button"
                            className={`fk-type-btn ${formData.type === type.id ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                            style={{ 
                              '--type-color': type.color,
                              borderColor: formData.type === type.id ? type.color : undefined 
                            }}
                          >
                            <Icon size={20} color={type.color} />
                            <span>{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name & Mobile */}
                  <div className="fk-form-row">
                    <div className="fk-form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="fk-form-group">
                      <label>Mobile Number *</label>
                      <div className="fk-mobile-input">
                        <span className="fk-country-code">+91</span>
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pincode with Location Button */}
                  <div className="fk-form-group fk-pincode-group">
                    <label>Pincode *</label>
                    <div className="fk-pincode-input-wrapper">
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handlePincodeChange}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        className={pincodeError ? 'error' : ''}
                        required
                      />
                      {pincodeLoading && <span className="fk-spinner">⟳</span>}
                      <button
                        type="button"
                        className="fk-locate-btn"
                        onClick={getCurrentLocation}
                        disabled={locationLoading}
                      >
                        <Navigation size={16} />
                        {locationLoading ? 'Locating...' : 'Use my location'}
                      </button>
                    </div>
                    {pincodeError && <span className="fk-error-text">{pincodeError}</span>}
                  </div>

                  {/* State & City */}
                  <div className="fk-form-row">
                    <div className="fk-form-group">
                      <label>State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        required
                      />
                    </div>
                    <div className="fk-form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        required
                      />
                    </div>
                  </div>

                  {/* District Field - ONLY ONE INSTANCE */}
                  <div className="fk-form-group">
                    <label>District</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="District (optional)"
                    />
                  </div>

                  {/* Locality/Area */}
                  <div className="fk-form-group">
                    <label>Locality / Area / Colony *</label>
                    <input
                      type="text"
                      name="locality"
                      value={formData.locality}
                      onChange={handleInputChange}
                      placeholder="Area, Colony, Street, Sector, Village"
                      required
                    />
                  </div>

                  {/* Building/Flat Number */}
                  <div className="fk-form-group">
                    <label>Building / Flat No. / House No. *</label>
                    <input
                      type="text"
                      name="buildingNo"
                      value={formData.buildingNo}
                      onChange={handleInputChange}
                      placeholder="e.g., A-42, Flat 301, House No. 123"
                      required
                    />
                  </div>

                  {/* Floor (Optional) */}
                  <div className="fk-form-group">
                    <label>Floor (Optional)</label>
                    <input
                      type="text"
                      name="floor"
                      value={formData.floor}
                      onChange={handleInputChange}
                      placeholder="e.g., Ground Floor, 1st Floor, 3rd Floor"
                    />
                  </div>

                  {/* Landmark (Optional) */}
                  <div className="fk-form-group">
                    <label>Nearest Landmark (Optional)</label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleInputChange}
                      placeholder="e.g., Near Metro Station, Opposite Mall, Behind School"
                    />
                  </div>

                  {/* Default Address Checkbox */}
                  <label className="fk-checkbox">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                    />
                    <span>Make this my default address</span>
                  </label>

                  {/* Form Actions */}
                  <div className="fk-form-actions">
                    <button 
                      type="button" 
                      className="fk-btn-cancel"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                        setFormData(EMPTY_ADDRESS);
                        if (savedAddresses.length === 0) {
                          toast.error('Please add at least one address');
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="fk-btn-save"
                    >
                      {editingAddress ? 'Update Address' : 'Save & Deliver Here'}
                    </button>
                  </div>
                </form>
              )}

              {/* No addresses message */}
              {!loadingAddresses && !showAddressForm && savedAddresses.length === 0 && (
                <div className="fk-no-addresses">
                  <p>No saved addresses found. Please add a new address.</p>
                  <button 
                    className="fk-add-address-btn"
                    onClick={() => setShowAddressForm(true)}
                  >
                    <Plus size={20} />
                    Add New Address
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method Section */}
            {selectedAddressId && (
              <div className="fk-section-card">
                <div className="fk-section-header">
                  <div className="fk-section-title">
                    <span className="fk-section-number">2</span>
                    <div>
                      <h3>Payment Method</h3>
                      <p className="fk-selected-summary">
                        {PAYMENT_METHODS.find(p => p.id === selectedPayment)?.label}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="fk-payment-methods">
                  {PAYMENT_METHODS.map((method, index) => {
                    const Icon = method.icon;
                    return (
                      <div
                        key={`${method.id}-${index}`}
                        className={`fk-payment-option ${selectedPayment === method.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPayment(method.id)}
                      >
                        <div className="fk-payment-radio">
                          <div className={`fk-radio ${selectedPayment === method.id ? 'checked' : ''}`} />
                        </div>
                        <div className="fk-payment-icon">
                          <Icon size={24} />
                        </div>
                        <div className="fk-payment-info">
                          <h4>{method.label}</h4>
                          <p>{method.subtext}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Payment Details Form */}
                {selectedPayment === 'upi' && (
                  <div className="fk-payment-details">
                    <input type="text" placeholder="Enter UPI ID (e.g., name@upi)" />
                  </div>
                )}

                {selectedPayment === 'card' && (
                  <div className="fk-payment-details">
                    <input type="text" placeholder="Card Number" maxLength={16} />
                    <div className="fk-card-row">
                      <input type="text" placeholder="MM/YY" maxLength={5} />
                      <input type="password" placeholder="CVV" maxLength={3} />
                    </div>
                    <input type="text" placeholder="Name on Card" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="fk-checkout-right">
            <div className="fk-price-card sticky">
              <h3>Price Details</h3>
              
              <div className="fk-price-breakdown">
                <div className="fk-price-item">
                  <span>Price ({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                  <span>₹{cartTotal}</span>
                </div>
                
                {securityDeposit > 0 && (
                  <div className="fk-price-item">
                    <span>Security Deposit (Refundable)</span>
                    <span>₹{securityDeposit}</span>
                  </div>
                )}
                
                <div className="fk-price-item">
                  <span>Delivery Charges</span>
                  <span className={deliveryCharge === 0 ? 'free' : ''}>
                    {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                  </span>
                </div>
              </div>

              <div className="fk-price-total">
                <span>Total Amount</span>
                <span>₹{finalTotal}</span>
              </div>

              {deliveryCharge === 0 && (
                <div className="fk-savings">
                  You saved ₹49 on delivery charges
                </div>
              )}

              {/* Delivery Estimate */}
              <div className="fk-delivery-estimate">
                <Truck size={16} />
                <span>Delivery by <strong>{new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</strong></span>
              </div>

              {/* Safety Badges */}
              <div className="fk-safety-badges">
                <div className="fk-badge">
                  <ShieldCheck size={14} />
                  <span>Secure Payments</span>
                </div>
                <div className="fk-badge">
                  <Clock size={14} />
                  <span>7-Day Returns</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                className="fk-btn-place-order"
                onClick={placeOrder}
                disabled={!selectedAddressId || placingOrder}
              >
                {placingOrder ? 'Placing Order...' : `Place Order • ₹${finalTotal}`}
              </button>

              <p className="fk-terms-note">
                By placing order, you agree to our Terms of Use and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}