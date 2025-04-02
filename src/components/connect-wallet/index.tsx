import { cn } from "@/lib/utils";
import { useAppKit, useAppKitAccount, useAppKitState } from "@reown/appkit/react";
import { motion } from "motion/react";
export const ConnectWallet = () => {
  const { open,  } = useAppKit();

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full py-3 rounded-xl text-center font-medium transition-all",
        "bg-amber-400 hover:bg-amber-500 text-amber-900"
      )}
      onClick={() => open()}
    >
      Connect Wallet
    </motion.button>
  );
};
