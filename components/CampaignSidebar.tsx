import React, { useState, useEffect, useRef } from 'react';
import type { Campaign } from '../types';
import { PlusIcon, TrashIcon, UserCircleIcon, LogoutIcon, LogoIcon } from './Icons';

interface CampaignSidebarProps {
  campaigns: Campaign[];
  activeCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
  onCreateCampaign: () => void;
  onDeleteCampaign: (id: string) => void;
  onUpdateCampaign: (id: string, updatedData: Partial<Campaign>) => void;
}

const CampaignListItem: React.FC<{
    campaign: Campaign;
    isActive: boolean;
    onSelect: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onUpdateName: (name: string) => void;
}> = ({ campaign, isActive, onSelect, onDelete, onUpdateName }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(campaign.name);
    const inputRef = useRef<HTMLInputElement>(null);

    // Simple status check
    const step1 = !!campaign.trendAnalysis.result;
    const step2 = !!campaign.socialContent.result;
    const step3 = !!campaign.crmContent.result;

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (name.trim() && name.trim() !== campaign.name) {
            onUpdateName(name.trim());
        } else {
            setName(campaign.name);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setName(campaign.name);
            setIsEditing(false);
        }
    };

    return (
        <li className="px-3 mb-0.5">
            <div 
                onClick={onSelect}
                onDoubleClick={() => setIsEditing(true)}
                className={`
                    group relative rounded-md px-3 py-2.5 cursor-pointer transition-all duration-200 flex items-center gap-3
                    ${isActive 
                        ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/5' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }
                `}
            >
                {/* Status Indicator Icon */}
                <div className="flex-shrink-0 flex gap-0.5">
                    <div className={`w-1 h-3 rounded-full ${step1 ? 'bg-blue-500' : 'bg-gray-700'}`} title="시장 분석 완료"></div>
                    <div className={`w-1 h-3 rounded-full ${step2 ? 'bg-purple-500' : 'bg-gray-700'}`} title="콘텐츠 생성 완료"></div>
                    <div className={`w-1 h-3 rounded-full ${step3 ? 'bg-pink-500' : 'bg-gray-700'}`} title="CRM 생성 완료"></div>
                </div>

                <div className="flex-1 min-w-0">
                     {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-black/50 text-sm p-0.5 border border-blue-500 rounded text-white focus:outline-none"
                        />
                    ) : (
                        <div className="flex flex-col">
                            <span className={`text-sm font-medium truncate ${isActive ? 'text-gray-100' : 'text-gray-400'}`}>
                                {campaign.name}
                            </span>
                             <span className="text-[10px] text-gray-600 font-mono">
                                {new Date(campaign.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>
                
                {/* Actions */}
                <button
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 rounded-md hover:bg-white/5 transition-opacity"
                    title="프로젝트 삭제"
                >
                    <TrashIcon />
                </button>
            </div>
        </li>
    );
};

export const CampaignSidebar: React.FC<CampaignSidebarProps> = ({
  campaigns,
  activeCampaignId,
  onSelectCampaign,
  onCreateCampaign,
  onDeleteCampaign,
  onUpdateCampaign,
}) => {
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
      onDeleteCampaign(id);
    }
  };

  return (
    <aside className="flex flex-col h-full w-full">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
               <div className="bg-gradient-to-tr from-purple-600 to-blue-600 p-1 rounded-lg">
                   <LogoIcon className="text-white w-4 h-4" />
               </div>
               <span className="text-sm font-bold tracking-tight text-white">Idus Global Studio</span>
          </div>
      </div>

      {/* Projects List */}
      <div className="flex-grow overflow-y-auto py-4">
        <div className="px-5 mb-2 flex items-center justify-between">
             <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">프로젝트 목록</h4>
             <button 
                onClick={onCreateCampaign}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="새 캠페인 생성"
             >
                 <PlusIcon />
             </button>
        </div>

        <nav>
            <ul>
                {campaigns.map((campaign) => (
                <CampaignListItem
                    key={campaign.id}
                    campaign={campaign}
                    isActive={activeCampaignId === campaign.id}
                    onSelect={() => onSelectCampaign(campaign.id)}
                    onDelete={(e) => handleDelete(e, campaign.id)}
                    onUpdateName={(newName) => onUpdateCampaign(campaign.id, { name: newName })}
                />
                ))}
            </ul>
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-white/5 bg-[#0B0F19]">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
                  <UserCircleIcon className="text-gray-400 w-5 h-5 group-hover:text-gray-200" />
              </div>
              <div className="flex-grow min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">마케팅 담당자</p>
                  <p className="text-[10px] text-gray-500 truncate">아이디어스 글로벌 팀</p>
              </div>
              <LogoutIcon className="text-gray-600 w-4 h-4 group-hover:text-gray-400" />
          </div>
      </div>
    </aside>
  );
};