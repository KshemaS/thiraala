import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { resolveProductLinks } from "./productLinks";

type Named = { id: string; name: string };
type Cat = Named & { slug: string };

function fakeDb(categories: Cat[], collections: Named[]) {
  const byName =
    <T extends Named>(rows: T[]) =>
    async ({ where }: { where: { name: { equals: string } } }) =>
      rows.find((r) => r.name.toLowerCase() === where.name.equals.toLowerCase()) ?? null;
  const create = vi.fn(async ({ data }: { data: Cat }) => {
    categories.push(data);
    return data;
  });
  const db = {
    category: {
      findFirst: byName(categories),
      findUnique: async ({ where }: { where: { slug: string } }) => categories.find((c) => c.slug === where.slug) ?? null,
      create,
    },
    collection: { findFirst: byName(collections) },
  };
  return { db: db as unknown as PrismaClient, create };
}

describe("resolveProductLinks", () => {
  it("links to the existing category and collection, whatever the capitals", async () => {
    const { db, create } = fakeDb([{ id: "c1", name: "Silk Sarees", slug: "silk-sarees" }], [{ id: "k1", name: "Onam" }]);
    const r = await resolveProductLinks(db, { categoryName: "silk sarees", collectionName: "ONAM" });
    expect(r).toEqual({ ok: true, categoryName: "Silk Sarees", categoryId: "c1", collectionName: "Onam", collectionId: "k1" });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a new category typed in the product form", async () => {
    const { db, create } = fakeDb([], []);
    const r = await resolveProductLinks(db, { categoryName: "Tissue Sarees" });
    expect(r).toMatchObject({ ok: true, categoryName: "Tissue Sarees" });
    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0].data.slug).toBe("tissue-sarees");
  });

  it("refuses an unknown collection without creating anything", async () => {
    const { db, create } = fakeDb([], []);
    const r = await resolveProductLinks(db, { categoryName: "New", collectionName: "Nope" });
    expect(r).toMatchObject({ ok: false });
    expect(create).not.toHaveBeenCalled();
  });

  it("clears the collection when it is emptied, and leaves unsent fields alone", async () => {
    const { db } = fakeDb([], []);
    expect(await resolveProductLinks(db, { collectionName: "" })).toEqual({ ok: true, collectionName: null, collectionId: null });
    expect(await resolveProductLinks(db, {})).toEqual({ ok: true });
  });
});
