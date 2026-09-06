import {
  CREATE_POST_TYPE_OPTIONS,
  type CreatePostType,
} from "@/lib/create-post-form";

type PostTypeSelectorProps = {
  value: CreatePostType;
  onChange: (type: CreatePostType) => void;
};

const typeStyles: Record<
  CreatePostType,
  { selected: string; idle: string }
> = {
  meal: {
    selected: "bg-meal-strong text-white",
    idle: "bg-meal-soft text-meal-strong",
  },
  nap: {
    selected: "bg-nap-strong text-white",
    idle: "bg-nap-soft text-nap-strong",
  },
  activity: {
    selected: "bg-activity-strong text-white",
    idle: "bg-activity-soft text-activity-strong",
  },
  achievement: {
    selected: "bg-achievement-strong text-white",
    idle: "bg-achievement-soft text-achievement-strong",
  },
  mood: {
    selected: "bg-link-badge-strong text-white",
    idle: "bg-link-badge-soft text-link-badge-strong",
  },
  photo: {
    selected: "bg-medical-badge-strong text-white",
    idle: "bg-medical-badge-soft text-medical-badge-strong",
  },
  announcement: {
    selected: "bg-announcement-strong text-white",
    idle: "bg-announcement-soft text-announcement-strong",
  },
};

export function PostTypeSelector({
  value,
  onChange,
}: PostTypeSelectorProps) {
  return (
    <section role="group" aria-labelledby="create-post-type-label">
      <h3
        id="create-post-type-label"
        className="mb-2.5 text-xs font-extrabold tracking-[0.7px] text-muted-strong"
      >
        TIPO
      </h3>

      <div className="flex flex-wrap gap-[9px]">
        {CREATE_POST_TYPE_OPTIONS.map((option) => {
          const isSelected = option.value === value;
          const styles = typeStyles[option.value];

          return (
            <button
              key={option.value}
              type="button"
              className={`rounded-full px-4 py-2 text-[13.5px] font-extrabold outline-none transition-[background-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-coral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-modal-card ${
                isSelected ? styles.selected : styles.idle
              }`}
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
