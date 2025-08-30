"use client";

import dynamic from "next/dynamic";
import { SurveillanceActivity, ContainerData } from "@/types/surveillance";

// Create a loading component that accepts title
const createLoadingComponent = (title: string) => {
  const LoadingComponent = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="h-96 md:h-[32rem] lg:h-[36rem] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading map...</span>
      </div>
    </div>
  );
  LoadingComponent.displayName = `LoadingComponent-${title}`;
  return LoadingComponent;
};

interface DynamicSurveillanceMapProps {
  activities: SurveillanceActivity[];
  containerData?: ContainerData[];
  title?: string;
}

export default function DynamicSurveillanceMap({
  activities,
  containerData = [],
  title = "Activity Locations",
}: DynamicSurveillanceMapProps) {
  // Create a dynamic component with the specific title for loading state
  const DynamicMapWithTitle = dynamic(() => import("./SurveillanceMap"), {
    ssr: false,
    loading: createLoadingComponent(title),
  });

  return <DynamicMapWithTitle activities={activities} containerData={containerData} title={title} />;
}
