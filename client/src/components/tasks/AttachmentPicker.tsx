import type { Attachment } from '@cybertactics/shared';
import { getAttachmentIcon } from './attachmentUtils';

interface AttachmentPickerProps {
  readonly attachments: Attachment[];
  readonly selectedIds: string[];
  readonly label: string;
  readonly onToggle: (attachmentId: string) => void;
}

export default function AttachmentPicker({
  attachments,
  selectedIds,
  label,
  onToggle,
}: AttachmentPickerProps) {
  return (
    <div className="min-w-0 max-w-full">
      <label className="block text-sm font-medium text-cyber-primary mb-2">{label}</label>
      <div className="grid gap-2 min-w-0 max-w-full [grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr))]">
        {attachments.map((attachment) => {
          const isSelected = selectedIds.includes(attachment.id);

          return (
            <button
              key={attachment.id}
              type="button"
              onClick={() => onToggle(attachment.id)}
              className={`min-w-0 max-w-full p-3 rounded-lg border cursor-pointer text-left transition-colors ${
                isSelected
                  ? 'bg-cyber-success/20 border-cyber-success'
                  : 'bg-cyber-panel border-cyber-border hover:border-cyber-primary hover:bg-cyber-primary/5'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{getAttachmentIcon(attachment.type)}</span>
                <span className="text-xs text-gray-400 truncate min-w-0 flex-1">
                  {attachment.name}
                </span>
                {isSelected && <span className="text-cyber-success text-lg shrink-0">✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
