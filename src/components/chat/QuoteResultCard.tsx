import { CheckCircle } from 'lucide-react';

interface QuoteResultCardProps {
  firstName: string;
  plan: string;
  rate: number;
  carrier: string;
  amBestRating: string;
  monthlySavings: number;
  annualSavings: number;
  currentPayment: number;
}

const QuoteResultCard = ({
  firstName,
  plan,
  rate,
  carrier,
  amBestRating,
  monthlySavings,
  annualSavings,
  currentPayment,
}: QuoteResultCardProps) => {
  return (
    <div className="ml-10 mb-3 max-w-[85%] animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white rounded-2xl rounded-bl-md shadow-sm overflow-hidden">
        {/* Green header */}
        <div className="bg-green-50 px-4 py-3 flex items-center gap-2 border-b border-green-100">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-800 text-[15px]">Great news, {firstName}!</span>
        </div>
        
        {/* Rate details */}
        <div className="px-4 py-4 space-y-3">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Your new {plan} rate</p>
            <p className="text-3xl font-bold text-green-600">${rate.toFixed(2)}<span className="text-base font-normal text-gray-500">/mo</span></p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">You're paying</span>
              <span className="font-medium">${currentPayment.toFixed(2)}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">New rate</span>
              <span className="font-medium text-green-600">${rate.toFixed(2)}/mo</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="text-gray-700 font-medium">Monthly savings</span>
              <span className="font-bold text-green-600">${monthlySavings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Annual savings</span>
              <span className="font-bold text-green-600">${annualSavings.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            via {carrier} (A.M. Best: {amBestRating})
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteResultCard;
