import Image from "next/image";

type BrandLogoProps = { className?: string; priority?: boolean };

export function BrandLogo({ className = "", priority = false }: BrandLogoProps) {
  return <Image className={`brand-logo ${className}`.trim()} src="/brand/vinicius-group-logo.png" width={2400} height={2400} sizes="(max-width: 640px) 180px, 240px" alt="Vinicius Group" priority={priority} />;
}
