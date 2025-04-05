"use client";

import { motion } from "framer-motion";

const LoadingCircleSpinner = () => {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-white bg-opacity-50 z-50">
      <motion.div
        className="w-12 h-12 rounded-full border-4 border-gray-300 border-t-pink-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

export default LoadingCircleSpinner;