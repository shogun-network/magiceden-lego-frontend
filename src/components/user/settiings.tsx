import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Settings } from "lucide-react";
import { useSwap } from "@/store";
import { isAddress} from "viem"

export function UserSettings() {
  const { nftContractAddress, setNftContractAddress } = useSwap();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(nftContractAddress);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    // Validate Ethereum address format
    if (!inputValue || !isAddress(inputValue)) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    setNftContractAddress(inputValue);
    setError(null);
    setOpen(false);
  };

  const handleCancel = () => {
    setInputValue(nftContractAddress);
    setError(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
      <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full cursor-pointer"
              >
                <Settings className="h-4 w-4" />
              </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>NFT Contract Address</DialogTitle>
          <DialogDescription>
            Enter the NFT contract address you want to interact with. 
            Note: We currently only support Berachain NFTs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="nftContract">NFT Contract Address</Label>
            <Input
              id="nftContract"
              placeholder="0x..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Enter the contract address of the Berachain NFT collection
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
            <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              Currently, we only support NFT collections deployed on Berachain.
            </p>
          </div>
        </div>

        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}