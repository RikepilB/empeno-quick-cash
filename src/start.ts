import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/errors";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);

    const message = error instanceof Error ? error.message : "Error interno del servidor";
    const isRpc = request?.headers.get("accept")?.includes("application/json");

    if (isRpc) {
      return Response.json({ error: message }, { status: 500 });
    }

    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
