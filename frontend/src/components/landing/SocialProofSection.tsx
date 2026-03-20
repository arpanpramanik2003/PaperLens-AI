export default function SocialProofSection() {
  return (
    <section className="py-8 sm:py-12 border-y border-border/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mb-6">
          Trusted by researchers at
        </p>
        <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 opacity-70">
          {["Nature", "IEEE", "arXiv", "Springer", "ACM"].map((name) => (
            <span key={name} className="font-mono text-sm text-muted-foreground font-medium">{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
