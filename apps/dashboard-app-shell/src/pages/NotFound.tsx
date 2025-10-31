import { Link } from "react-router-dom";

import { Button, Card } from "@efficio/ui";

export const NotFound = () => {
  return (
    <Card
      title="Page not found"
      description="The view you were looking for cannot be reached."
      actions={
        <Button asChild size="sm">
          <Link to="/">Return home</Link>
        </Button>
      }
      className="mx-auto w-full max-w-xl text-center"
    >
      <p className="text-sm text-slate-500">
        If you believe this is a mistake, please check the remote configuration
        or deployment status.
      </p>
    </Card>
  );
};

