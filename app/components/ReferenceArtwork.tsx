"use client";
import React from "react";

/**
 * Cropped visual art from the homepage reference supplied by the Zeshu owner.
 * Product and service prices remain sourced exclusively from real catalogues.
 * The single source image is reused across slices and cached once by browsers.
 * If the reference CDN becomes unavailable, replace it with a local optimized
 * image asset; never present the screenshot itself as a functional webpage.
 */
const REFERENCE = "https://d2ol7oe51mr4n9.cloudfront.net/user_3JEWOqisqN1dgwr4TYI6pNAfQYR/adcac24b-61f2-4ed2-a069-f9066e7678c6.jpg";
const slices = {
  logo: "27 86 114 119",
  hero: "303 450 385 434",
  basket: "458 977 225 196",
  grocery: "18 1188 125 106",
  fruit: "156 1188 128 106",
  dairy: "294 1188 129 106",
  snacks: "428 1188 130 106",
  drinks: "562 1188 136 106"
} as const;
export type ReferenceArtworkSlice = keyof typeof slices;
export default function ReferenceArtwork({ slice, className = "" }: { slice: ReferenceArtworkSlice; className?: string }) {
  return <svg
    viewBox={slices[slice]}
    className={className}
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
  ><image href={REFERENCE} x="0" y="0" width="698" height="1536" preserveAspectRatio="none" /></svg>;
}
