import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { InstrumentLoading } from "./components/InstrumentLoading";
import { OverviewPage } from "./pages/OverviewPage";

const CalculatorPage = lazy(() =>
  import("./pages/CalculatorPage").then((module) => ({
    default: module.CalculatorPage,
  })),
);
const CaseStudiesPage = lazy(() =>
  import("./pages/CaseStudiesPage").then((module) => ({
    default: module.CaseStudiesPage,
  })),
);
const DisclosuresPage = lazy(() =>
  import("./pages/DisclosuresPage").then((module) => ({
    default: module.DisclosuresPage,
  })),
);
const EstimatorPage = lazy(() =>
  import("./pages/EstimatorPage").then((module) => ({
    default: module.EstimatorPage,
  })),
);
const FacilitiesMapPage = lazy(() =>
  import("./pages/FacilitiesMapPage").then((module) => ({
    default: module.FacilitiesMapPage,
  })),
);
const ForecastPage = lazy(() =>
  import("./pages/ForecastPage").then((module) => ({
    default: module.ForecastPage,
  })),
);

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<RouteLoadingState />}>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/map" element={<FacilitiesMapPage />} />
              <Route path="/disclosures" element={<DisclosuresPage />} />
              <Route path="/estimator" element={<EstimatorPage />} />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="/case-studies" element={<CaseStudiesPage />} />
              <Route path="/calculator" element={<CalculatorPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function RouteLoadingState() {
  return <InstrumentLoading className="rounded-sm border border-well/15" />;
}
