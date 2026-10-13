"use client";

import React, { useState, useEffect } from "react";
import { MockTest } from "@/types";
import { TestCard } from "./TestCard";

interface FeaturedTestsClientProps {
  initialTests: MockTest[];
}

export function FeaturedTestsClient({ initialTests }: FeaturedTestsClientProps) {
  const [tests, setTests] = useState<MockTest[]>(initialTests);

  useEffect(() => {
    if (initialTests && initialTests.length > 0) {
      setTests(initialTests);
    }

    // Refresh from Firestore upon mount to guarantee live freshness
    import("@/lib/data/testService").then(({ fetchCanonicalFeaturedTests }) => {
      fetchCanonicalFeaturedTests().then((fresh) => {
        if (fresh && fresh.length > 0) {
          setTests(fresh);
        }
      });
    });

    const handleUpdate = () => {
      import("@/lib/data/testService").then(({ fetchCanonicalFeaturedTests }) => {
        fetchCanonicalFeaturedTests().then((fresh) => {
          if (fresh && fresh.length > 0) {
            setTests(fresh);
          }
        });
      });
    };

    window.addEventListener("testorbit_admin_data_updated", handleUpdate);
    return () => window.removeEventListener("testorbit_admin_data_updated", handleUpdate);
  }, [initialTests]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {tests.map((test) => (
        <TestCard key={test.id} test={test} />
      ))}
    </div>
  );
}
