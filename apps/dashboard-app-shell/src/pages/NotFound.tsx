import { Link } from "react-router-dom";

import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@efficio/ui";

export const NotFound = () => {
  return (
    <Card className="mx-auto w-full max-w-xl text-center">
      <CardHeader>
        <CardTitle>Page not found</CardTitle>
        <CardDescription>The view you were looking for cannot be reached.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500">
          If you believe this is a mistake, please check the remote configuration
          or deployment status.
        </p>
      </CardContent>
      <CardFooter className="justify-center">
        <Button asChild size="sm">
          <Link to="/">Return home</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

