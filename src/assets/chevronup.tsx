import * as React from "react";
import { SVGProps } from "react";
export const ChevronUp = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={14}
    height={9}
    viewBox="0 0 14 9"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M13 7.5L7 1.5L1 7.5" fill="black" />
    <path
      d="M13 7.5L7 1.5L1 7.5"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

