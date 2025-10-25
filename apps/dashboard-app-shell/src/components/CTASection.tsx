import { Button } from "@efficio/ui/src/components/ui/button";

type CTAProps = { onGetStarted?: () => void };
export default function CTASection({ onGetStarted }: CTAProps) {
  return (
    <section className="w-full bg-indigo-500 py-20">
      <div className="max-w-[896px] mx-auto px-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-6 leading-10">
          Ready to Transform Your Productivity?
        </h2>
        <p className="text-xl text-indigo-100 mb-10 leading-7">
          Join thousands of professionals who have already optimized their workflow with Efficio.
        </p>
        <Button className="bg-white hover:bg-gray-100 text-indigo-500 h-[60px] px-12 rounded-lg text-lg font-semibold" onClick={onGetStarted}>
          Start Your Free Trial
        </Button>
      </div>
    </section>
  );
}
