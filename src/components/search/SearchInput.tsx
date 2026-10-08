"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/lib/hooks/use-debounce"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search placements...",
  onClear,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, 300)
  const onChangeRef = useRef(onChange)
  const isInitialMount = useRef(true)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setLocalValue(value)
  }, [value])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (debouncedValue !== value) {
      onChangeRef.current(debouncedValue)
    }
  }, [debouncedValue, value])

  const handleClear = useCallback(() => {
    setLocalValue("")
    onChangeRef.current("")
    onClear?.()
  }, [onClear])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
