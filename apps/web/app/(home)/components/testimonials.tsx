import { Star } from "lucide-react";
import { testimonials } from "@/lib/marketing/testimonials";

const avatarColors: Record<string, string> = {
  terra: "bg-jp-terra text-white",
  teal: "bg-jp-teal text-white",
  default: "bg-[var(--jp-bg-dark)] text-white",
};

const roleTags: Record<string, string> = {
  terra: "bg-jp-terra/10 text-jp-terra",
  teal: "bg-jp-teal/10 text-jp-teal",
  default: "bg-[var(--jp-chip-bg)] text-[var(--jp-chip-text)]",
};

export const Testimonials = () => (
  <section
    className="py-[72px] md:py-[100px]"
    style={{ backgroundColor: "var(--jp-bg-page)" }}
  >
    <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
      {/* Header */}
      <div className="reveal mb-12 text-center">
        <span className="mb-3 inline-block font-jp-mono font-medium text-[10px] text-[var(--jp-muted)] uppercase tracking-[0.14em]">
          What people are saying
        </span>
        <h2 className="mx-auto max-w-xl font-black font-display text-[clamp(32px,4vw,52px)] text-[var(--jp-text)] leading-[1.1] tracking-[-0.025em]">
          Good coffee, good cause.
        </h2>
      </div>

      {/* Testimonial grid */}
      <div className="reveal grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <div
            className="flex flex-col justify-between rounded-[var(--jp-radius-lg)] border p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--jp-shadow-md)]"
            key={t.author}
            style={{
              backgroundColor: "var(--jp-bg-card)",
              borderColor: "var(--jp-border)",
            }}
          >
            {/* Stars */}
            <div>
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    className="fill-amber-400 text-amber-400"
                    // biome-ignore lint/suspicious/noArrayIndexKey: static star rating
                    key={i}
                    size={14}
                  />
                ))}
              </div>
              <blockquote className="mb-6 font-body text-[15px] text-[var(--jp-text)] italic leading-[1.65]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
            </div>

            {/* Author */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full font-bold font-display text-sm ${avatarColors[t.avatarVariant]}`}
              >
                {t.avatarInitial}
              </div>
              <div className="flex flex-col">
                <span className="font-body font-medium text-[var(--jp-text)] text-sm">
                  {t.author}
                </span>
                <span
                  className={`mt-0.5 w-fit rounded-full px-2 py-0.5 font-jp-mono font-medium text-[9px] uppercase tracking-[0.10em] ${roleTags[t.avatarVariant]}`}
                >
                  {t.role}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
