"use client";

import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';
import { apiCall } from '../../utils/api';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'discount' | 'newsletter';
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  targetAudience: string;
  sentCount: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  scheduledFor?: string;
}

interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  status: 'active' | 'inactive' | 'expired';
}

interface AutomationRule {
  id: string;
  name: string;
  type: 'welcome' | 'abandoned_cart' | 'low_stock' | 'birthday' | 'reorder';
  status: 'active' | 'inactive';
  trigger: string;
  action: string;
  stats: {
    triggered: number;
    converted: number;
    conversionRate: number;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'welcome' | 'promotional' | 'transactional' | 'abandoned_cart';
  preview: string;
  createdAt: string;
}

export default function MarketingPage() {
  const { addToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'campaigns' | 'discounts' | 'automation' | 'templates'>('campaigns');
  
  // Modal states
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewDiscount, setShowNewDiscount] = useState(false);
  const [showNewAutomation, setShowNewAutomation] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  
  // Edit modal states
  const [showEditCampaign, setShowEditCampaign] = useState(false);
  const [showEditDiscount, setShowEditDiscount] = useState(false);
  const [showEditAutomation, setShowEditAutomation] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [showUseTemplate, setShowUseTemplate] = useState(false);
  
  // Selected items for editing/viewing
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationRule | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    content: '',
    targetAudience: 'all',
    scheduledFor: ''
  });

  const [discountForm, setDiscountForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minOrderAmount: 0,
    maxUses: 100,
    validFrom: '',
    validUntil: ''
  });

  const [automationForm, setAutomationForm] = useState({
    name: '',
    type: 'welcome' as 'welcome' | 'abandoned_cart' | 'low_stock' | 'birthday' | 'reorder',
    trigger: '',
    action: ''
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'welcome' as 'welcome' | 'promotional' | 'transactional' | 'abandoned_cart'
  });

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const fetchMarketingData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("admin_jwt");
      
      // Fetch campaigns
      const campaignsRes = await apiCall('/api/marketing/campaigns', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      // Fetch discounts
      const discountsRes = await apiCall('/api/marketing/discounts', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      // Fetch automation rules
      const automationRes = await apiCall('/api/marketing/automation', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.campaigns || []);
      }
      
      if (discountsRes.ok) {
        const discountsData = await discountsRes.json();
        setDiscounts(discountsData.discounts || []);
      }

      if (automationRes.ok) {
        const automationData = await automationRes.json();
        setAutomationRules(automationData.rules || []);
      }

      // Fetch email templates from backend
      try {
        const templatesRes = await apiCall('/api/marketing/templates', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setEmailTemplates(templatesData.templates || []);
        } else {
          // Fallback to mock data if endpoint doesn't exist
          setEmailTemplates([
            {
              id: '1',
              name: 'Welcome Email',
              subject: 'Welcome to Labubu Collectibles!',
              category: 'welcome',
              preview: 'Welcome to our community of collectors...',
              createdAt: '2024-01-15'
            },
            {
              id: '2',
              name: 'Abandoned Cart Recovery',
              subject: 'Complete your purchase',
              category: 'abandoned_cart',
              preview: 'You left some amazing items in your cart...',
              createdAt: '2024-01-10'
            },
            {
              id: '3',
              name: 'New Product Launch',
              subject: 'New Labubu figures available!',
              category: 'promotional',
              preview: 'Discover our latest collection...',
              createdAt: '2024-01-05'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch email templates:', error);
        // Fallback to mock data
        setEmailTemplates([
          {
            id: '1',
            name: 'Welcome Email',
            subject: 'Welcome to Labubu Collectibles!',
            category: 'welcome',
            preview: 'Welcome to our community of collectors...',
            createdAt: '2024-01-15'
          },
          {
            id: '2',
            name: 'Abandoned Cart Recovery',
            subject: 'Complete your purchase',
            category: 'abandoned_cart',
            preview: 'You left some amazing items in your cart...',
            createdAt: '2024-01-10'
          },
          {
            id: '3',
            name: 'New Product Launch',
            subject: 'New Labubu figures available!',
            category: 'promotional',
            preview: 'Discover our latest collection...',
            createdAt: '2024-01-05'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch marketing data:', error);
      setError('Failed to load marketing data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const generateDiscountCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDiscountForm(prev => ({ ...prev, code: result }));
  };

  const handleCreateCampaign = async () => {
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const response = await apiCall('/api/marketing/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(campaignForm)
      });

      if (response.ok) {
        setShowNewCampaign(false);
        setCampaignForm({ name: '', subject: '', content: '', targetAudience: 'all', scheduledFor: '' });
        fetchMarketingData();
        addToast({
          type: 'success',
          title: 'Campaign Created',
          message: `"${campaignForm.name}" has been created successfully!`,
          duration: 4000
        });
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Campaign Creation Failed',
          message: error.error || 'Failed to create campaign',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to create campaign. Please check your connection and try again.',
        duration: 5000
      });
    }
  };

  const handleCreateDiscount = async () => {
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const response = await apiCall('/api/marketing/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(discountForm)
      });

      if (response.ok) {
        setShowNewDiscount(false);
        setDiscountForm({ code: '', type: 'percentage', value: 0, minOrderAmount: 0, maxUses: 100, validFrom: '', validUntil: '' });
        fetchMarketingData();
        addToast({
          type: 'success',
          title: 'Discount Code Created',
          message: `"${discountForm.code}" has been created successfully!`,
          duration: 4000
        });
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Discount Creation Failed',
          message: error.error || 'Failed to create discount code',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Failed to create discount:', error);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to create discount code. Please check your connection and try again.',
        duration: 5000
      });
    }
  };

  const handleCreateAutomation = async () => {
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const response = await apiCall('/api/marketing/automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(automationForm)
      });

      if (response.ok) {
        setShowNewAutomation(false);
        setAutomationForm({ name: '', type: 'welcome', trigger: '', action: '' });
        fetchMarketingData();
        addToast({
          type: 'success',
          title: 'Automation Rule Created',
          message: `"${automationForm.name}" has been created successfully!`,
          duration: 4000
        });
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Automation Creation Failed',
          message: error.error || 'Failed to create automation rule',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Failed to create automation rule:', error);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to create automation rule. Please check your connection and try again.',
        duration: 5000
      });
    }
  };

  // Button handlers for campaigns
  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      subject: campaign.name, // Using name as subject for now
      content: '',
      targetAudience: campaign.targetAudience,
      scheduledFor: campaign.scheduledFor || ''
    });
    setShowEditCampaign(true);
  };

  const handleViewCampaignDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowViewDetails(true);
  };

  const handleSendCampaign = async (campaign: Campaign) => {
    if (!confirm(`Are you sure you want to send this campaign to ${campaign.targetAudience} customers?`)) {
      return;
    }
    
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const response = await apiCall(`/api/marketing/campaigns/${campaign.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const result = await response.json();
        fetchMarketingData();
        addToast({
          type: 'success',
          title: 'Campaign Sent Successfully',
          message: `"${campaign.name}" sent to ${result.sent} recipients${result.failed > 0 ? ` (${result.failed} failed)` : ''}`,
          duration: 5000
        });
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Campaign Send Failed',
          message: error.error || 'Failed to send campaign',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Failed to send campaign:', error);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to send campaign. Please check your connection and try again.',
        duration: 5000
      });
    }
  };

  const handleUpdateCampaign = async () => {
    if (!selectedCampaign) return;
    
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const response = await apiCall(`/api/marketing/campaigns/${selectedCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(campaignForm)
      });

      if (response.ok) {
        setShowEditCampaign(false);
        setSelectedCampaign(null);
        fetchMarketingData();
      }
    } catch (error) {
      console.error('Failed to update campaign:', error);
    }
  };

  // Button handlers for discounts
  const handleEditDiscount = (discount: Discount) => {
    setSelectedDiscount(discount);
    setDiscountForm({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minOrderAmount: discount.minOrderAmount || 0,
      maxUses: discount.maxUses,
      validFrom: discount.validFrom,
      validUntil: discount.validUntil
    });
    setShowEditDiscount(true);
  };

  const handleDeleteDiscount = async (discount: Discount) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;
    
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const response = await apiCall(`/api/marketing/discounts/${discount.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        fetchMarketingData();
        addToast({
          type: 'success',
          title: 'Discount Code Deleted',
          message: `"${discount.code}" has been deleted successfully!`,
          duration: 4000
        });
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Delete Failed',
          message: error.error || 'Failed to delete discount code',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Failed to delete discount:', error);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to delete discount code. Please check your connection and try again.',
        duration: 5000
      });
    }
  };

  const handleUpdateDiscount = async () => {
    if (!selectedDiscount) return;
    
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const response = await apiCall(`/api/marketing/discounts/${selectedDiscount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(discountForm)
      });

      if (response.ok) {
        setShowEditDiscount(false);
        setSelectedDiscount(null);
        fetchMarketingData();
      }
    } catch (error) {
      console.error('Failed to update discount:', error);
    }
  };

  // Button handlers for automation rules
  const handleConfigureAutomation = (rule: AutomationRule) => {
    setSelectedAutomation(rule);
    setAutomationForm({
      name: rule.name,
      type: rule.type,
      trigger: rule.trigger,
      action: rule.action
    });
    setShowEditAutomation(true);
  };

  const handleViewAutomationDetails = (rule: AutomationRule) => {
    setSelectedAutomation(rule);
    setShowViewDetails(true);
  };

  const handleUpdateAutomation = async () => {
    if (!selectedAutomation) return;
    
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const response = await apiCall(`/api/marketing/automation/${selectedAutomation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(automationForm)
      });

      if (response.ok) {
        setShowEditAutomation(false);
        setSelectedAutomation(null);
        fetchMarketingData();
      }
    } catch (error) {
      console.error('Failed to update automation rule:', error);
    }
  };

  // Button handlers for templates
  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: '',
      category: template.category
    });
    setShowEditTemplate(true);
  };

  const handleUseTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setCampaignForm({
      name: `Campaign using ${template.name}`,
      subject: template.subject,
      content: template.preview,
      targetAudience: 'all',
      scheduledFor: ''
    });
    setShowUseTemplate(false);
    setShowNewCampaign(true);
  };

  const handleCreateTemplate = async () => {
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const response = await apiCall('/api/marketing/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(templateForm)
      });

      if (response.ok) {
        setShowNewTemplate(false);
        setTemplateForm({ name: '', subject: '', content: '', category: 'welcome' });
        fetchMarketingData();
        addToast({
          type: 'success',
          title: 'Email Template Created',
          message: `"${templateForm.name}" has been created successfully!`,
          duration: 4000
        });
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Template Creation Failed',
          message: error.error || 'Failed to create email template',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to create email template. Please check your connection and try again.',
        duration: 5000
      });
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const response = await apiCall(`/api/marketing/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(templateForm)
      });

      if (response.ok) {
        setShowEditTemplate(false);
        setSelectedTemplate(null);
        fetchMarketingData();
      }
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading marketing data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchMarketingData}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Marketing Automation</h1>
          <p className="text-xl text-gray-500 mb-8">Manage campaigns, discounts, and customer engagement</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'campaigns', label: 'Email Campaigns' },
              { id: 'discounts', label: 'Discount Codes' },
              { id: 'automation', label: 'Automation Rules' },
              { id: 'templates', label: 'Email Templates' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Email Campaigns</h2>
              <button
                onClick={() => setShowNewCampaign(true)}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Create Campaign
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm flex-grow">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium capitalize">{campaign.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Audience:</span>
                      <span className="font-medium">{campaign.targetAudience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sent:</span>
                      <span className="font-medium">{campaign.sentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Open Rate:</span>
                      <span className="font-medium">{(campaign.openRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Click Rate:</span>
                      <span className="font-medium">{(campaign.clickRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-medium">{formatDate(campaign.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                    <button 
                      onClick={() => handleEditCampaign(campaign)}
                      className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleViewCampaignDetails(campaign)}
                      className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      View Details
                    </button>
                    {campaign.status === 'draft' && (
                      <button 
                        onClick={() => handleSendCampaign(campaign)}
                        className="flex-1 py-3 rounded-xl border border-green-400 bg-white text-green-600 text-xs font-semibold hover:bg-green-50 hover:border-green-500 transition-colors"
                      >
                        Send
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discounts Tab */}
        {activeTab === 'discounts' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Discount Codes</h2>
              <button
                onClick={() => setShowNewDiscount(true)}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Create Discount
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {discounts.map((discount) => (
                <div key={discount.id} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 font-mono">{discount.code}</h3>
                      <p className="text-sm text-gray-500 capitalize">{discount.type} discount</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(discount.status)}`}>
                      {discount.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Value:</span>
                      <span className="font-semibold text-gray-900">
                        {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Usage:</span>
                      <span className="font-medium text-gray-900">
                        {discount.usedCount} / {discount.maxUses}
                      </span>
                    </div>
                    
                    {(discount.minOrderAmount || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Min Order:</span>
                        <span className="font-medium text-gray-900">${discount.minOrderAmount}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Valid Until:</span>
                      <span className="font-medium text-gray-900">{formatDate(discount.validUntil)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                    <button 
                      onClick={() => handleEditDiscount(discount)}
                      className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteDiscount(discount)}
                      className="flex-1 py-3 rounded-xl border border-red-400 bg-white text-red-600 text-xs font-semibold hover:bg-red-50 hover:border-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automation Tab */}
        {activeTab === 'automation' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Automation Rules</h2>
              <button
                onClick={() => setShowNewAutomation(true)}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Create Rule
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {automationRules.map((rule) => (
                <div key={rule.id} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rule.status)}`}>
                      {rule.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 capitalize">{rule.type.replace('_', ' ')} automation</p>
                  <div className="space-y-2 text-sm flex-grow">
                    <div className="flex items-center justify-between">
                      <span>Triggered:</span>
                      <span className="font-medium">{rule.stats.triggered}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Converted:</span>
                      <span className="font-medium">{rule.stats.converted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Conversion rate:</span>
                      <span className="font-medium">{(rule.stats.conversionRate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button 
                      onClick={() => handleConfigureAutomation(rule)}
                      className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      Configure
                    </button>
                    <button 
                      onClick={() => handleViewAutomationDetails(rule)}
                      className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
              <button
                onClick={() => setShowNewTemplate(true)}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {emailTemplates.map((template) => (
                <div key={template.id} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col h-full">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {template.category.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm flex-grow">
                    <div>
                      <span className="text-gray-500">Subject:</span>
                      <p className="font-medium">{template.subject}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Preview:</span>
                      <p className="text-gray-600">{template.preview}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-medium">{formatDate(template.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                    <button 
                      onClick={() => handleEditTemplate(template)}
                      className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campaign Creation Modal */}
        {showNewCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Email Campaign</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter campaign name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter email subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                  <select
                    value={campaignForm.targetAudience}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="all">All Customers</option>
                    <option value="new">New Customers</option>
                    <option value="returning">Returning Customers</option>
                    <option value="inactive">Inactive Customers</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                  <textarea
                    value={campaignForm.content}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter email content..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    value={campaignForm.scheduledFor}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowNewCampaign(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCampaign}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discount Creation Modal */}
        {showNewDiscount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Discount Code</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountForm.code}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, code: e.target.value }))}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter code"
                    />
                    <button
                      onClick={generateDiscountCode}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={discountForm.type}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                    <input
                      type="number"
                      value={discountForm.value}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder={discountForm.type === 'percentage' ? '10' : '5.00'}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Amount</label>
                  <input
                    type="number"
                    value={discountForm.minOrderAmount}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Uses</label>
                  <input
                    type="number"
                    value={discountForm.maxUses}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="100"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
                    <input
                      type="date"
                      value={discountForm.validFrom}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, validFrom: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                    <input
                      type="date"
                      value={discountForm.validUntil}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, validUntil: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowNewDiscount(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDiscount}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Create Discount
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Edit Modal */}
        {showEditCampaign && selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Campaign</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter campaign name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter email subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                  <select
                    value={campaignForm.targetAudience}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="all">All Customers</option>
                    <option value="new">New Customers</option>
                    <option value="returning">Returning Customers</option>
                    <option value="inactive">Inactive Customers</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                  <textarea
                    value={campaignForm.content}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter email content..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    value={campaignForm.scheduledFor}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowEditCampaign(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCampaign}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Update Campaign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discount Edit Modal */}
        {showEditDiscount && selectedDiscount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Discount Code</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
                  <input
                    type="text"
                    value={discountForm.code}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter code"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={discountForm.type}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                    <input
                      type="number"
                      value={discountForm.value}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder={discountForm.type === 'percentage' ? '10' : '5.00'}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Amount</label>
                  <input
                    type="number"
                    value={discountForm.minOrderAmount}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Uses</label>
                  <input
                    type="number"
                    value={discountForm.maxUses}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="100"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
                    <input
                      type="date"
                      value={discountForm.validFrom}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, validFrom: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                    <input
                      type="date"
                      value={discountForm.validUntil}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, validUntil: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowEditDiscount(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDiscount}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Update Discount
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Automation Edit Modal */}
        {showEditAutomation && selectedAutomation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Configure Automation Rule</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                  <input
                    type="text"
                    value={automationForm.name}
                    onChange={(e) => setAutomationForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter rule name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={automationForm.type}
                    onChange={(e) => setAutomationForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="welcome">Welcome Series</option>
                    <option value="abandoned_cart">Abandoned Cart</option>
                    <option value="low_stock">Low Stock Alert</option>
                    <option value="birthday">Birthday Offer</option>
                    <option value="reorder">Reorder Reminder</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trigger</label>
                  <input
                    type="text"
                    value={automationForm.trigger}
                    onChange={(e) => setAutomationForm(prev => ({ ...prev, trigger: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., user_registration, cart_abandoned"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <input
                    type="text"
                    value={automationForm.action}
                    onChange={(e) => setAutomationForm(prev => ({ ...prev, action: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., send_welcome_email, send_reminder"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowEditAutomation(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateAutomation}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Update Rule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Edit Modal */}
        {showEditTemplate && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Email Template</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter email subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="welcome">Welcome</option>
                    <option value="promotional">Promotional</option>
                    <option value="transactional">Transactional</option>
                    <option value="abandoned_cart">Abandoned Cart</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                  <textarea
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter email content..."
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowEditTemplate(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTemplate}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Update Template
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showViewDetails && (selectedCampaign || selectedAutomation) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {selectedCampaign ? 'Campaign Details' : 'Automation Rule Details'}
              </h3>
              
              <div className="space-y-4">
                {selectedCampaign && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="font-medium">{selectedCampaign.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCampaign.status)}`}>
                          {selectedCampaign.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Type:</span>
                        <p className="font-medium capitalize">{selectedCampaign.type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Target Audience:</span>
                        <p className="font-medium">{selectedCampaign.targetAudience}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Sent Count:</span>
                        <p className="font-medium">{selectedCampaign.sentCount}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Open Rate:</span>
                        <p className="font-medium">{(selectedCampaign.openRate * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Click Rate:</span>
                        <p className="font-medium">{(selectedCampaign.clickRate * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Created:</span>
                        <p className="font-medium">{formatDate(selectedCampaign.createdAt)}</p>
                      </div>
                    </div>
                  </>
                )}
                
                {selectedAutomation && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="font-medium">{selectedAutomation.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAutomation.status)}`}>
                          {selectedAutomation.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Type:</span>
                        <p className="font-medium capitalize">{selectedAutomation.type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Trigger:</span>
                        <p className="font-medium">{selectedAutomation.trigger}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Action:</span>
                        <p className="font-medium">{selectedAutomation.action}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Triggered:</span>
                        <p className="font-medium">{selectedAutomation.stats.triggered}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Converted:</span>
                        <p className="font-medium">{selectedAutomation.stats.converted}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Conversion Rate:</span>
                        <p className="font-medium">{(selectedAutomation.stats.conversionRate * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowViewDetails(false)}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Creation Modal */}
        {showNewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Email Template</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter email subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="welcome">Welcome</option>
                    <option value="promotional">Promotional</option>
                    <option value="transactional">Transactional</option>
                    <option value="abandoned_cart">Abandoned Cart</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                  <textarea
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter email content..."
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowNewTemplate(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Automation Rule Creation Modal */}
        {showNewAutomation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Automation Rule</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                  <input
                    type="text"
                    value={automationForm.name}
                    onChange={(e) => setAutomationForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter rule name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={automationForm.type}
                    onChange={(e) => setAutomationForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="welcome">Welcome Series</option>
                    <option value="abandoned_cart">Abandoned Cart</option>
                    <option value="low_stock">Low Stock Alert</option>
                    <option value="birthday">Birthday Offer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trigger</label>
                  <input
                    type="text"
                    value={automationForm.trigger}
                    onChange={(e) => setAutomationForm(prev => ({ ...prev, trigger: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., user_registration, cart_abandoned"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <input
                    type="text"
                    value={automationForm.action}
                    onChange={(e) => setAutomationForm(prev => ({ ...prev, action: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., send_welcome_email, send_reminder"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowNewAutomation(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAutomation}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 