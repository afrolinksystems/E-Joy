type PrintRetryResultProps = {
  result: string
}

export function PrintRetryResult({ result }: PrintRetryResultProps) {
  if (!result) return null

  return <pre className="mt-4 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{result}</pre>
}
