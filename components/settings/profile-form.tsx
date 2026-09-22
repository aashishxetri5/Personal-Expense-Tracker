"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saveSettings } from "@/lib/actions/settings";
import { settingsSchema } from "@/lib/validations/planning";

type SettingsValues = z.input<typeof settingsSchema>;

export function ProfileForm({
  name,
  currency,
  locale,
  defaultMonthlyIncome,
}: {
  name: string;
  currency: string;
  locale: string;
  defaultMonthlyIncome: number;
}) {
  const form = useForm<SettingsValues, unknown, z.output<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name, currency, locale, defaultMonthlyIncome },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await saveSettings(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved");
  });

  const errors = form.formState.errors;

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Currency and locale are settings, not constants — every figure in the app reformats when
            you change them.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="profile-name" required error={errors.name?.message}>
            <Input id="profile-name" {...form.register("name")} />
          </Field>

          <Field
            label="Currency code"
            htmlFor="profile-currency"
            required
            hint="A short ISO code such as NPR, INR or USD."
            error={errors.currency?.message}
          >
            <Input id="profile-currency" className="uppercase" maxLength={6} {...form.register("currency")} />
          </Field>

          <Field
            label="Number formatting"
            htmlFor="profile-locale"
            hint="Controls digit grouping, e.g. en-NP or en-US."
            error={errors.locale?.message}
          >
            <Input id="profile-locale" {...form.register("locale")} />
          </Field>

          <Field
            label="Default monthly income"
            htmlFor="profile-income"
            hint="Pre-fills the income target when you start a new month's budget."
            error={errors.defaultMonthlyIncome?.message}
          >
            <Input
              id="profile-income"
              inputMode="decimal"
              className="tabular"
              {...form.register("defaultMonthlyIncome")}
            />
          </Field>
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" size="sm" loading={form.formState.isSubmitting}>
            <Save /> Save profile
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
