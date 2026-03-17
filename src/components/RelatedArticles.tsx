import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const allArticles = [
  {
    slug: "/plan-g-vs-f-vs-n",
    title: "Plan G vs F vs N: Which Saves You More?",
    description: "Side-by-side comparison of coverage, costs, and which Medigap plan is the best value.",
  },
  {
    slug: "/cheapest-plan-g-rates",
    title: "Cheapest Plan G Rates by Carrier",
    description: "See which A-rated carriers offer the lowest Plan G premiums in your area.",
  },
  {
    slug: "/why-medigap-rates-increase",
    title: "Why Your Medigap Rate Keeps Going Up",
    description: "Understand price optimization, rate increases, and how to stop overpaying.",
  },
  {
    slug: "/switch-medigap-plans",
    title: "How to Switch Medigap Plans Without Losing Coverage",
    description: "Step-by-step guide to switching carriers while keeping the same benefits.",
  },
];

interface RelatedArticlesProps {
  currentSlug: string;
}

const RelatedArticles = ({ currentSlug }: RelatedArticlesProps) => {
  const related = allArticles.filter((a) => a.slug !== currentSlug);

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <h2 className="text-2xl font-bold text-foreground mb-6">Related Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map((article) => (
          <Link
            key={article.slug}
            to={article.slug}
            className="group block rounded-lg border border-border p-6 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
              {article.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{article.description}</p>
            <span className="inline-flex items-center text-sm font-medium text-primary">
              Read more <ArrowRight className="ml-1 h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedArticles;
