type PrintRetryResultProps = {
  result: string
}

export function PrintRetryResult({ result }: PrintRetryResultProps) {
  if (!result) return null

  return <pre className="mt-4 overflow-auto rounded-lg bg-foreground p-4 text-xs text-background">{result}</pre>
}
