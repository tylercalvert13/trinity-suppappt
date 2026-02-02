import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const FAQSection = () => {
  const faqs = [
    {
      question: "Am I paying too much for Medicare Supplement insurance?",
      answer: "If you haven't compared rates in the past year, there's a good chance you're overpaying. Insurance carriers often gradually increase premiums on loyal customers while offering lower rates to new policyholders. Since all Medigap plans are federally standardized, you can switch to a carrier with lower rates and get the exact same coverage. Many seniors save $100-200 per month simply by switching carriers."
    },
    {
      question: "Is my Plan G the same no matter which company I buy from?",
      answer: "Yes, absolutely. By federal law, all Medicare Supplement plans are standardized. This means Plan G from Aflac covers the exact same benefits as Plan G from Medico, Aetna, Mutual of Omaha, or any other carrier. The only difference is the price you pay. That's why comparing rates from multiple carriers is so important—you get identical coverage at potentially significant savings."
    },
    {
      question: "Can I switch Medicare Supplement carriers without losing coverage?",
      answer: "Yes, you can switch Medigap carriers at any time. However, outside of your Medigap Open Enrollment Period (the 6 months after you turn 65 and enroll in Medicare Part B), you may need to answer health questions and could be denied based on pre-existing conditions. Our licensed agents can help you understand your options and guide you through the process, including carriers with more favorable underwriting."
    },
    {
      question: "Why do Medicare Supplement rates vary so much by carrier?",
      answer: "Several factors cause rate variations: each carrier uses different pricing methods (attained-age, issue-age, or community-rated), has different risk pools of policyholders, operates in different regions, and has varying overhead costs. Some carriers also use 'price optimization' where they gradually raise rates on long-term customers. This is why comparing rates annually can save you hundreds or even thousands of dollars per year."
    },
    {
      question: "What is the difference between Plan G, Plan F, and Plan N?",
      answer: "Plan F offers 100% coverage of Medicare gaps but is only available if you became eligible for Medicare before January 1, 2020. Plan G is the most popular choice today—it covers everything except the annual Part B deductible ($240 in 2024). Plan N has lower premiums but includes small copays for some office visits ($20) and emergency room visits ($50). All three plans let you see any doctor who accepts Medicare, with no referrals needed."
    },
    {
      question: "How do I know if I qualify to switch Medicare Supplement plans?",
      answer: "Qualification depends on your health status and timing. During your Medigap Open Enrollment Period, you're guaranteed acceptance regardless of health conditions. Outside this window, carriers can review your medical history. However, many carriers have favorable underwriting for common conditions. Our free rate comparison includes a health pre-qualification check so you know your options before applying."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-background" aria-label="Frequently Asked Questions about Medicare Supplement Insurance">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-healthcare rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Medicare Supplement Questions Answered
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get clear answers to the most common questions about Medigap plans, 
            switching carriers, and saving money on your coverage.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                <AccordionTrigger className="text-left text-foreground hover:text-primary py-6">
                  <span className="text-base md:text-lg font-medium pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Still have questions? Get personalized answers from a licensed Medicare Supplement specialist.
          </p>
          <Button 
            variant="hero" 
            size="lg" 
            className="text-lg px-8"
            onClick={() => window.location.href = '/suppappt'}
          >
            Get My Free Rate Comparison
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
