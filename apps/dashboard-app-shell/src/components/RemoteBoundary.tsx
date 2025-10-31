import type { PropsWithChildren, ReactNode } from "react";
import { Component, Suspense } from "react";
import { Loader2 } from "lucide-react";

import { Card } from "@efficio/ui";

interface RemoteBoundaryProps {
  title?: ReactNode;
  description?: ReactNode;
  moduleName?: string;
}

interface RemoteErrorState {
  hasError: boolean;
  error?: Error;
}

class RemoteErrorBoundary extends Component<
  PropsWithChildren<{ fallback: ReactNode }> ,
  RemoteErrorState
> {
  state: RemoteErrorState = { hasError: false };

  static getDerivedStateFromError(error: Error): RemoteErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Failed to load remote module", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

const Skeleton = ({ title, description }: RemoteBoundaryProps) => (
  <Card
    title={title ?? "Loading remote module"}
    description={
      description ?? "Fetching the latest bundle from the remote container..."
    }
    className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center"
  >
    <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
    <p className="text-sm text-slate-500">
      This takes a moment the first time as we hydrate shared styles.
    </p>
  </Card>
);

const Failure = ({ title, moduleName }: RemoteBoundaryProps) => (
  <Card
    title={title ?? "Unavailable"}
    description="We couldn't connect to the remote manifest."
    className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center"
  >
    <p className="text-sm text-slate-500">
      {moduleName
        ? `Check that the ${moduleName} container is running and accessible.`
        : "Please verify the remote container is available."}
    </p>
    <p className="text-xs text-slate-400">
      Inspect the browser console for more details or retry after starting the
      remote dev server.
    </p>
  </Card>
);

export const RemoteBoundary = ({
  children,
  title,
  description,
  moduleName
}: PropsWithChildren<RemoteBoundaryProps>) => (
  <RemoteErrorBoundary
    fallback={<Failure title={title} moduleName={moduleName} />}
  >
    <Suspense fallback={<Skeleton title={title} description={description} />}>
      {children}
    </Suspense>
  </RemoteErrorBoundary>
);

RemoteBoundary.Skeleton = Skeleton;
RemoteBoundary.Failure = Failure;

