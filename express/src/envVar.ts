const envVar = {
  anthropicAPIKey: (process.env.ANTHROPIC_API_KEY ?? "") as string,
  langsmithAPIKey: (process.env.LANGSMITH_API_KEY ?? "") as string,
  langchainProject: (process.env.LANGCHAIN_PROJECT ?? "") as string,
  langchainTracingV2: (process.env.LANGCHAIN_TRACING_V2 ?? "") as string,
  databaseURL: (process.env.DATABASE_URL ?? "") as string,
  port: (process.env.PORT ?? 3001) as number,
};

export default envVar;
