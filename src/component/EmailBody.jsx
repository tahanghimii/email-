import React, { useState } from "react";
import { FileText, ChevronDown, ChevronUp, Clock } from "lucide-react";

const EmailBody = ({ email }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-blue-50 rounded-2xl shadow-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100 transition duration-200"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-800">Email Content</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-blue-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-blue-600" />
        )}
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-6">
          <div className="bg-white text-blue-800 p-4 rounded-xl whitespace-pre-wrap shadow-sm">
            {email.body}
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600">
            <Clock className="w-4 h-4 mr-2" />
            {email.body.split(/\s+/).length} words · {email.body.length} characters
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailBody;
