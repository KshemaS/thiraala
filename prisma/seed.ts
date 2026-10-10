import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { seedAdminUser } from "./seed-admin";

const prisma = new PrismaClient();

async function main() {

  // 1. Seed Categories
  const categoriesFile = path.join(process.cwd(), "data", "categories.json");
  if (fs.existsSync(categoriesFile)) {
    const raw = fs.readFileSync(categoriesFile, "utf8");
    const categories = JSON.parse(raw);
    for (const cat of categories) {
      const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await prisma.category.upsert({
        where: { name: cat.name },
        update: {
          slug,
          description: cat.description || null,
          image: cat.image || null,
          status: cat.status || "active",
        },
        create: {
          id: cat.id || undefined,
          name: cat.name,
          slug,
          description: cat.description || null,
          image: cat.image || null,
          status: cat.status || "active",
        },
      });
    }
    console.log(`✅ Seeded ${categories.length} categories`);
  }

  // 2. Seed Collections
  const collectionsFile = path.join(process.cwd(), "data", "collections.json");
  if (fs.existsSync(collectionsFile)) {
    const raw = fs.readFileSync(collectionsFile, "utf8");
    const collections = JSON.parse(raw);
    for (const col of collections) {
      const slug = col.slug || col.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await prisma.collection.upsert({
        where: { name: col.name },
        update: {
          slug,
          description: col.description || null,
          image: col.image || null,
          status: col.status || "active",
          featured: Boolean(col.featured),
        },
        create: {
          id: col.id || undefined,
          name: col.name,
          slug,
          description: col.description || null,
          image: col.image || null,
          status: col.status || "active",
          featured: Boolean(col.featured),
        },
      });
    }
    console.log(`✅ Seeded ${collections.length} collections`);
  }

  // Fetch created categories and collections for mapping
  const allCategories = await prisma.category.findMany();
  const allCollections = await prisma.collection.findMany();

  // 3. Seed Products
  const productsFile = path.join(process.cwd(), "data", "products.json");
  if (fs.existsSync(productsFile)) {
    const raw = fs.readFileSync(productsFile, "utf8");
    const products = JSON.parse(raw);
    for (const prod of products) {
      const slug = prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const matchedCat = allCategories.find(
        (c) => c.name.toLowerCase() === prod.category?.toLowerCase()
      );
      const collectionName = prod.collection || (prod.collections && prod.collections[0]) || null;
      const matchedCol = collectionName
        ? allCollections.find((c) => c.name.toLowerCase() === collectionName.toLowerCase())
        : null;

      await prisma.product.upsert({
        where: { sku: prod.sku },
        update: {
          name: prod.name,
          slug,
          price: prod.price,
          priceValue: Number(prod.priceValue) || 0,
          categoryName: prod.category || "General",
          categoryId: matchedCat?.id || null,
          collectionName: collectionName,
          collectionId: matchedCol?.id || null,
          stock: Number(prod.stock) >= 0 ? Number(prod.stock) : 0,
          fabric: prod.fabric || null,
          color: prod.color || null,
          pattern: prod.pattern || null,
          description: prod.description || null,
          foldedImg: prod.foldedImg || null,
          wornImg: prod.wornImg || null,
          altFolded: prod.altFolded || null,
          altWorn: prod.altWorn || null,
          status: prod.status || "active",
          featured: Boolean(prod.featured),
          isNewArrival: Boolean(prod.isNewArrival),
        },
        create: {
          sku: prod.sku,
          name: prod.name,
          slug,
          price: prod.price,
          priceValue: Number(prod.priceValue) || 0,
          categoryName: prod.category || "General",
          categoryId: matchedCat?.id || null,
          collectionName: collectionName,
          collectionId: matchedCol?.id || null,
          stock: Number(prod.stock) >= 0 ? Number(prod.stock) : 0,
          fabric: prod.fabric || null,
          color: prod.color || null,
          pattern: prod.pattern || null,
          description: prod.description || null,
          foldedImg: prod.foldedImg || null,
          wornImg: prod.wornImg || null,
          altFolded: prod.altFolded || null,
          altWorn: prod.altWorn || null,
          status: prod.status || "active",
          featured: Boolean(prod.featured),
          isNewArrival: Boolean(prod.isNewArrival),
        },
      });
    }
    console.log(`✅ Seeded ${products.length} products`);
  }

  // 4. Seed Hero Banners
  const bannersFile = path.join(process.cwd(), "data", "hero-banners.json");
  if (fs.existsSync(bannersFile)) {
    const raw = fs.readFileSync(bannersFile, "utf8");
    const banners = JSON.parse(raw);
    let order = 1;
    for (const [key, val] of Object.entries(banners)) {
      if (typeof val === "string") {
        await prisma.heroBanner.upsert({
          where: { imageKey: key },
          update: { imageUrl: val, order },
          create: {
            imageKey: key,
            imageUrl: val,
            order,
          },
        });
        order++;
      }
    }
    console.log(`✅ Seeded hero banners`);
  }

  // 5. Seed Editorial Photos
  const editorialFile = path.join(process.cwd(), "data", "editorial-photos.json");
  if (fs.existsSync(editorialFile)) {
    const raw = fs.readFileSync(editorialFile, "utf8");
    const photos = JSON.parse(raw);
    let order = 1;
    for (const photo of photos) {
      if (photo.id && photo.url) {
        await prisma.editorialPhoto.upsert({
          where: { id: photo.id },
          update: {
            title: photo.title || "Editorial",
            url: photo.url,
            order,
          },
          create: {
            id: photo.id,
            title: photo.title || "Editorial",
            url: photo.url,
            order,
          },
        });
        order++;
      }
    }
    console.log(`✅ Seeded ${photos.length} editorial photos`);
  }

  // 6. Seed Admin User (credentials from ADMIN_USERNAME / ADMIN_PASSWORD)
  await seedAdminUser(prisma);

  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
