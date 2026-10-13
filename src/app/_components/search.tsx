"use client"

// Component de busca para a página inicial

import { SearchIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Form, FormField, FormItem, FormControl, FormMessage } from "./ui/form"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// Esquema de validação para os parâmetros de busca
const forSchema = z.object({
  search: z.string().trim().min(1, {
    message: "Digite o nome de uma barbearia ou serviço.",
  }),
})

type SearchProps = {
  initialValue?: string
}

const Search = ({ initialValue = "" }: SearchProps) => {
  const form = useForm<z.infer<typeof forSchema>>({
    resolver: zodResolver(forSchema),
    defaultValues: {
      search: initialValue,
    },
  })

  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const onSubmit = (data: z.infer<typeof forSchema>) => {
    const q = encodeURIComponent(data.search)
    startTransition(() => router.push(`/barbershops?search=${q}`))
  }

  return (
    // O formulário de busca é simples, com um campo de input e um botão de submit. Ele utiliza o react-hook-form para gerenciamento do estado do formulário e validação, e o zod para definir o esquema de validação.
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <FormField
          control={form.control}
          name="search"
          render={({ field, fieldState }: any) => (
            <FormItem className="w-full">
              <label htmlFor="barbershop-search" className="sr-only">
                Buscar por nome ou serviço
              </label>
              <FormControl>
                <Input
                  id="barbershop-search"
                  aria-label="Buscar barbearias por nome ou serviço"
                  aria-invalid={fieldState?.invalid || undefined}
                  aria-describedby={
                    fieldState?.error ? "barbershop-search-error" : undefined
                  }
                  className="w-full rounded-md bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                  placeholder="Buscar por nome ou serviço"
                  {...field}
                />
              </FormControl>
              {fieldState?.error && (
                <FormMessage
                  id="barbershop-search-error"
                  className="ml-2 mt-1 text-sm text-destructive"
                >
                  {String(fieldState.error.message)}
                </FormMessage>
              )}
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          size="icon"
          aria-label="Buscar"
          className="rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/85"
        >
          <SearchIcon />
        </Button>
      </form>
    </Form>
  )
}

export default Search
