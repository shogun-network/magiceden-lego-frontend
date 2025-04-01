type CoinAvatarProps = {
  coinImageUrl: string;
  chainImageUrl: string;
  size?: number;
};

export default function CoinAvatar({
  coinImageUrl,
  chainImageUrl,
  size = 48,
}: CoinAvatarProps) {
  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      {/* Coin Image */}
      <img
        src={coinImageUrl}
        alt="Coin"
        width={size}
        height={size}
        className="rounded-full border border-gray-300"
        onError={(e) => {
            (e.target as HTMLImageElement).src = "/default.png";
          }}
      />

      {/* Chain Image Badge */}
      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px] shadow-md">
        <img
          src={chainImageUrl}
          alt="Chain"
          width={size / 2.5}
          height={size / 2.5}
          className="rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/default.png";
          }}
        />
      </div>
    </div>
  );
}
