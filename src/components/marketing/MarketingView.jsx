import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Send, 
  Users, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useTenantCollection } from '../../hooks/useTenantFirestore';
import { useTenant } from '../../contexts/TenantContext';
import CampaignModal from './CampaignModal';

export default function MarketingView() {
  const { currentStore } = useTenant();
  const { docs: campaigns, loading: campLoading } = useTenantCollection('campaigns');
  const { docs: customers } = useTenantCollection('customers');

  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [sentMap, setSentMap] = useState({});

  const handleSendToCustomer = (campaign, customer) => {
    const rawMsg = campaign.message || '';
    const personalized = rawMsg
      .replace('{CustomerName}', customer.name)
      .replace('{StoreName}', currentStore?.name || 'Retail Store')
      .replace('{StorePhone}', currentStore?.phone || '');

    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.startsWith('231') ? cleanPhone : '231' + cleanPhone.replace(/^0/, '');
    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(personalized)}`, '_blank');

    setSentMap((prev) => ({
      ...prev,
      [`${campaign.id}_${customer.id}`]: true
    }));
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">WhatsApp Marketing Hub</h1>
          <p className="text-xs text-slate-500 mt-1">
            Zero-cost customer re-engagement and broadcast marketing via direct WhatsApp
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Create Broadcast Campaign
        </button>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Campaigns</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{campaigns.length}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Megaphone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Audience Reach</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{customers.filter(c => c.phone).length}</p>
            <span className="text-[11px] text-slate-400 font-medium">Valid Phone Numbers</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-purple-700">VIP Loyalty Club</span>
            <p className="text-2xl font-black text-purple-900 mt-1">
              {customers.filter(c => Number(c.loyaltyPoints || 0) >= 100).length}
            </p>
            <span className="text-[11px] text-purple-600 font-medium">High Value Shoppers</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-slate-900 text-base">Campaign History & Dispatch</h2>

          {campaigns.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50 stroke-1" />
              <p className="font-semibold text-sm">No campaigns launched yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Create a campaign to broadcast promotions and restock alerts to your customers.
              </p>
            </div>
          ) : (
            campaigns.map((camp) => (
              <div
                key={camp.id}
                onClick={() => setSelectedCampaign(camp)}
                className={`bg-white rounded-2xl p-5 border shadow-sm cursor-pointer transition ${
                  selectedCampaign?.id === camp.id
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {camp.targetAudience} AUDIENCE
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-2">{camp.title}</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {camp.date ? new Date(camp.date).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mt-3 font-mono line-clamp-2">
                  "{camp.message}"
                </p>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span>Targeted Recipients: <strong>{camp.recipientCount || 'All'}</strong></span>
                  <span className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
                    Open Dispatch Queue <Send className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Campaign Dispatch Queue */}
        <div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
            <h3 className="font-bold text-slate-900 text-base mb-1">Dispatch Queue</h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedCampaign ? `Broadcasting: ${selectedCampaign.title}` : 'Select a campaign to dispatch'}
            </p>

            {selectedCampaign ? (
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                {customers
                  .filter((c) => c.phone)
                  .map((cust) => {
                    const isSent = sentMap[`${selectedCampaign.id}_${cust.id}`];
                    return (
                      <div
                        key={cust.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold text-slate-800 truncate">{cust.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{cust.phone}</div>
                        </div>

                        <button
                          onClick={() => handleSendToCustomer(selectedCampaign, cust)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 shrink-0 ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {isSent ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" /> Send WA
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Send className="w-8 h-8 mb-2 opacity-30 stroke-1" />
                <span>Select a campaign from the left list to broadcast to customers.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <CampaignModal
          customers={customers}
          onClose={() => setShowModal(false)}
          onCreated={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
