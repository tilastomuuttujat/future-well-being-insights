import { ReactNode } from "react";

interface Props {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  right?: ReactNode;
}

export const MetaSection = ({ id, eyebrow, title, children, right }: Props) => (
  <section id={id} className="border-t border-ink/10 py-10">
    <div className="flex items-baseline justify-between gap-3 flex-wrap mb-5">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="font-serif text-2xl sm:text-3xl text-ink mt-1">{title}</h2>
      </div>
      {right}
    </div>
    {children}
  </section>
);
