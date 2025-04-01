import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { generateFromString } from "generate-avatar";
import { Button } from "../ui/button";

export const UserAccount = () => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  if (!isConnected || !address) return null;
  return (
    <Button
      variant="ghost"
      onClick={() => {
        open({ view: "Account" });
      }}
      size="icon"
      className="h-8 w-8 rounded-full cursor-pointer"
    >
      <img
        className="h-6 w-6 rounded-full"
        src={`data:image/svg+xml;utf8,${generateFromString(address)}`}
        alt={address}
      />
    </Button>
  );
};
