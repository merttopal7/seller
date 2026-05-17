import * as Icons from "lucide-react";

export const AVAILABLE_ICONS = [
  { name: "Car", label: "Automotive & Vehicles" },
  { name: "Home", label: "Real Estate & Housing" },
  { name: "Smartphone", label: "Phones & Electronics" },
  { name: "Laptop", label: "Computers & Tech" },
  { name: "Gamepad", label: "Video Games & Toys" },
  { name: "Sofa", label: "Furniture & Decor" },
  { name: "Shirt", label: "Fashion & Clothing" },
  { name: "Dumbbell", label: "Sports & Fitness" },
  { name: "Briefcase", label: "Jobs & Careers" },
  { name: "BookOpen", label: "Books & Education" },
  { name: "Wrench", label: "Services & Handyman" },
  { name: "Bike", label: "Bicycles & Outdoors" },
  { name: "Camera", label: "Cameras & Photo" },
  { name: "Gift", label: "Free Items & Donations" },
  { name: "Heart", label: "Pets & Community" },
  { name: "Music", label: "Music & Audio" },
  { name: "Folder", label: "Generic Folder" },
];

interface CategoryIconProps {
  name: string | null | undefined;
  image?: string | null | undefined;
  className?: string;
}

export function CategoryIcon({ name, image, className = "h-5 w-5" }: CategoryIconProps) {
  if (image && image.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt="Category thumbnail"
        className={`${className} object-cover rounded-lg shrink-0`}
      />
    );
  }

  if (!name) {
    return <Icons.Folder className={className} />;
  }

  // Normalize the name: trim whitespace and capitalize first letter (e.g., "car" -> "Car")
  const trimmed = name.trim();
  const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  // Search dynamic exports from lucide-react
  const IconComponent = (Icons as any)[normalized] || (Icons as any)[trimmed] || Icons.Folder;

  return <IconComponent className={className} />;
}
