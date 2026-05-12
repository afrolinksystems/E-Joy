import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is missing. Set it in apps/order-service/.env',
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const shopId = 'test-shop-001';

  // Ensure shop exists
  await prisma.shop.upsert({
    where: { id: shopId },
    update: {},
    create: {
      id: shopId,
      name: 'E-Joy Addis Ababa',
    },
  });

  console.log(`Seeding menu items for shop: ${shopId}...`);

  const products = [
    // Breakfast
    { shopId, name: 'Normal Fetira', unitPrice: 23000, category: 'Breakfast', active: true },
    { shopId, name: 'Special Fetira', unitPrice: 33000, category: 'Breakfast', active: true },
    { shopId, name: 'Normal Full', unitPrice: 28000, category: 'Breakfast', active: true },
    { shopId, name: 'Special Full', unitPrice: 38000, category: 'Breakfast', active: true },
    { shopId, name: 'Normal Chechebsa', unitPrice: 28000, category: 'Breakfast', active: true },
    { shopId, name: 'Special Chechebsa', unitPrice: 38000, category: 'Breakfast', active: true },
    { shopId, name: 'Omelet', unitPrice: 20000, category: 'Breakfast', active: true },
    { shopId, name: 'Scrambled egg', unitPrice: 25000, category: 'Breakfast', active: true },

    // Fasting Main Dish
    { shopId, name: 'Shiro with Salad', unitPrice: 30000, category: 'Fasting Main Dish', active: true },
    { shopId, name: 'Fasting Firfir', unitPrice: 28000, category: 'Fasting Main Dish', active: true },
    { shopId, name: 'Spaghetti with Vegetable', unitPrice: 30000, category: 'Fasting Main Dish', active: true },
    { shopId, name: 'Spaghetti with Tuna', unitPrice: 40000, category: 'Fasting Main Dish', active: true },
    { shopId, name: 'Spaghetti with Tomato', unitPrice: 30000, category: 'Fasting Main Dish', active: true },
    { shopId, name: 'Spaghetti with Bologna', unitPrice: 40000, category: 'Fasting Main Dish', active: true },

    // Non-Fasting Main Dish
    { shopId, name: 'Chickina Tibs', unitPrice: 75000, category: 'Non-Fasting Main Dish', active: true },
    { shopId, name: 'Kuanta(Tibs) Firfir', unitPrice: 50000, category: 'Non-Fasting Main Dish', active: true },
    { shopId, name: 'Mawa C2 Tibs', unitPrice: 75000, category: 'Non-Fasting Main Dish', active: true },
    { shopId, name: 'Fried Fish', unitPrice: 65000, category: 'Non-Fasting Main Dish', active: true },
    { shopId, name: 'Chicken Breast', unitPrice: 75000, category: 'Non-Fasting Main Dish', active: true },

    // Pizza
    { shopId, name: 'Vegetable Pizza', unitPrice: 45000, category: 'Pizza', active: true },
    { shopId, name: 'Margarita Pizza', unitPrice: 50000, category: 'Pizza', active: true },
    { shopId, name: 'Chicken Pizza', unitPrice: 60000, category: 'Pizza', active: true },
    { shopId, name: 'Tuna Pizza', unitPrice: 60000, category: 'Pizza', active: true },
    { shopId, name: 'Beef Pizza', unitPrice: 60000, category: 'Pizza', active: true },
    { shopId, name: 'Mawa Special Pizza', unitPrice: 75000, category: 'Pizza', active: true },

    // Burger
    { shopId, name: 'Beef Burger', unitPrice: 50000, category: 'Burger', active: true },
    { shopId, name: 'Cheese Burger', unitPrice: 60000, category: 'Burger', active: true },
    { shopId, name: 'French Fries', unitPrice: 25000, category: 'Burger', active: true },
    { shopId, name: 'Mawa Special Burger', unitPrice: 70000, category: 'Burger', active: true },

    // Cake
    { shopId, name: 'Banana cake', unitPrice: 15000, category: 'Cake', active: true },
    { shopId, name: 'English Cake', unitPrice: 20000, category: 'Cake', active: true },
    { shopId, name: 'Plain Croissant', unitPrice: 20000, category: 'Cake', active: true },
    { shopId, name: 'Butter Croissant', unitPrice: 25000, category: 'Cake', active: true },

    // Extras
    { shopId, name: 'Boiled egg', unitPrice: 2500, category: 'Extras', active: true },
    { shopId, name: 'Cheese', unitPrice: 6000, category: 'Extras', active: true },
    { shopId, name: 'Tuna', unitPrice: 6000, category: 'Extras', active: true },
    { shopId, name: 'Take away box', unitPrice: 6000, category: 'Extras', active: true },

    // Tea
    { shopId, name: 'Black Tea', unitPrice: 6000, category: 'Tea', active: true },
    { shopId, name: 'Lemon Tea', unitPrice: 7000, category: 'Tea', active: true },
    { shopId, name: 'Ginger Tea', unitPrice: 8000, category: 'Tea', active: true },
    { shopId, name: 'Cinnamon Tea', unitPrice: 6000, category: 'Tea', active: true },
    { shopId, name: 'Peanut Tea', unitPrice: 9000, category: 'Tea', active: true },
    { shopId, name: 'Normal Special Tea', unitPrice: 18000, category: 'Tea', active: true },
    { shopId, name: 'Mawa Special Tea', unitPrice: 25000, category: 'Tea', active: true },

    // Coffee
    { shopId, name: 'Normal Coffee', unitPrice: 10000, category: 'Coffee', active: true },
    { shopId, name: 'Americano', unitPrice: 10000, category: 'Coffee', active: true },
    { shopId, name: 'Espresso', unitPrice: 10000, category: 'Coffee', active: true },
    { shopId, name: 'Double espresso', unitPrice: 13000, category: 'Coffee', active: true },
    { shopId, name: 'Normal Macchiato', unitPrice: 10000, category: 'Coffee', active: true },
    { shopId, name: 'Fasting Macchiato', unitPrice: 15000, category: 'Coffee', active: true },
    { shopId, name: 'Double Macchiato', unitPrice: 18000, category: 'Coffee', active: true },

    // Beverage
    { shopId, name: 'Milk', unitPrice: 12000, category: 'Beverage', active: true },
    { shopId, name: 'Hot Chocolate', unitPrice: 18000, category: 'Beverage', active: true },
    { shopId, name: 'Cappuccino', unitPrice: 18000, category: 'Beverage', active: true },
    { shopId, name: 'Cafe Latte', unitPrice: 15000, category: 'Beverage', active: true },
    { shopId, name: 'Mocha latte', unitPrice: 15000, category: 'Beverage', active: true },
    { shopId, name: 'Tea latte', unitPrice: 12000, category: 'Beverage', active: true },
    { shopId, name: 'Macha Latte', unitPrice: 20000, category: 'Beverage', active: true },

    // Iced Beverage
    { shopId, name: 'Iced Latte', unitPrice: 15000, category: 'Iced Beverage', active: true },
    { shopId, name: 'Iced Tea', unitPrice: 10000, category: 'Iced Beverage', active: true },
    { shopId, name: 'Iced Coffee', unitPrice: 12000, category: 'Iced Beverage', active: true },
    { shopId, name: 'Iced Mocha', unitPrice: 15000, category: 'Iced Beverage', active: true },

    // Mojito
    { shopId, name: 'Orange Mojito', unitPrice: 22000, category: 'Mojito', active: true },
    { shopId, name: 'Watermelon Mojito', unitPrice: 20000, category: 'Mojito', active: true },
    { shopId, name: 'Lemon Mojito', unitPrice: 22000, category: 'Mojito', active: true },
    { shopId, name: 'Cinnamon Mojito', unitPrice: 20000, category: 'Mojito', active: true },
    { shopId, name: 'Strawberry Mojito', unitPrice: 22000, category: 'Mojito', active: true },

    // Fresh Juice
    { shopId, name: 'Orange Juice', unitPrice: 32000, category: 'Fresh Juice', active: true },
    { shopId, name: 'Watermelon Juice', unitPrice: 20000, category: 'Fresh Juice', active: true },
    { shopId, name: 'Papaya Juice', unitPrice: 20000, category: 'Fresh Juice', active: true },
    { shopId, name: 'Avocado Sprice (Mango/Papaya)', unitPrice: 25000, category: 'Fresh Juice', active: true },
    { shopId, name: 'Mawa Special Juice', unitPrice: 28000, category: 'Fresh Juice', active: true },

    // Water & Soft Drink
    { shopId, name: 'Water 0.5L', unitPrice: 4000, category: 'Water & Soft Drink', active: true },
    { shopId, name: 'Ambo', unitPrice: 7000, category: 'Water & Soft Drink', active: true },
    { shopId, name: 'Soda', unitPrice: 7000, category: 'Water & Soft Drink', active: true },
  ];

  await prisma.product.createMany({
    data: products,
  });

  console.log(`✅ Successfully seeded ${products.length} menu items!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
