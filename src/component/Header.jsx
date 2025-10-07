import React from 'react';
import { Mail } from 'lucide-react';

const Header = () => {
  return (
    <div className="text-center mb-10">
      <Mail className="w-20 h-20 mx-auto mb-4 text-indigo-600" />
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-2">Email PDF Extractor</h1>
      <p className="text-gray-500 text-lg">Upload multiple .eml or .msg files to extract and merge PDF attachments</p>
    </div>
  );
};

export default Header;