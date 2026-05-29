"use client"

import React from "react"
import { useController } from "react-hook-form"

type FormProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode
}

export function Form(props: FormProps & any) {
  const { children, ...rest } = props
  return <div {...rest}>{children}</div>
}

export function FormField({ control, name, render }: any) {
  const { field, fieldState } = useController({ name, control })

  return render({ field, fieldState })
}

export function FormItem({ className, children, ...rest }: any) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  )
}

export function FormControl({ children, ...rest }: any) {
  return <div {...rest}>{children}</div>
}

export function FormLabel({ children, ...rest }: any) {
  return (
    <label {...rest} className={rest.className}>
      {children}
    </label>
  )
}

export function FormDescription({ children, ...rest }: any) {
  return <p {...rest}>{children}</p>
}

export function FormMessage({ className, ...rest }: any) {
  // This simple implementation expects the parent to pass an "error" prop or
  // the fieldState via render if needed. For our use-case, render will handle it.
  return <p className={className} {...rest} />
}

export default Form
