import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { OrderStatus, ROLES } from "./schema";

/**
 * One-time demo seed (idempotent — safe to re-run).
 * Equivalent of prisma/seed.ts for this environment: it populates the
 * marketplace so all three panels have real data to work with.
 * The first admin is bootstrapped separately via provisioning.bootstrapFirstAdmin
 * (never through a public registration route).
 */

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

interface SeedRestaurant {
  name: string;
  description: string;
  cuisines: string[];
  rating: number;
  ratingCount: number;
  address: string;
  lat: number;
  lng: number;
  image: string;
  deliveryTimeMins: number;
  deliveryFeePaise: number;
  featured?: boolean;
  menu: {
    category: string;
    items: {
      name: string;
      description: string;
      price: number; // rupees
      isVeg: boolean;
      popular?: boolean;
    }[];
  }[];
}

const RESTAURANTS: SeedRestaurant[] = [
  {
    name: "Biryani Blues",
    description: "Slow-cooked dum biryanis, kebabs and saffron romance from old Hyderabad.",
    cuisines: ["Biryani", "Mughlai", "Kebabs"],
    rating: 4.4,
    ratingCount: 2314,
    address: "14, MG Road, Indiranagar, Bengaluru",
    lat: 12.9719,
    lng: 77.6412,
    image: img("photo-1585937421612-70a008356fbe"),
    deliveryTimeMins: 32,
    deliveryFeePaise: 3900,
    featured: true,
    menu: [
      {
        category: "Biryani",
        items: [
          { name: "Hyderabadi Chicken Dum Biryani", description: "Fragrant basmati, saffron, caramelised onions", price: 289, isVeg: false, popular: true },
          { name: "Mutton Dum Biryani", description: "Tender mutton, slow-cooked for 6 hours", price: 379, isVeg: false, popular: true },
          { name: "Veg Dum Biryani", description: "Seasonal vegetables, mint & fried onions", price: 219, isVeg: true },
          { name: "Egg Biryani", description: "Spiced rice layered with boiled eggs", price: 229, isVeg: false },
        ],
      },
      {
        category: "Kebabs",
        items: [
          { name: "Chicken Tikka Kebab (6 pc)", description: "Charred in the tandoor, mint chutney", price: 249, isVeg: false, popular: true },
          { name: "Paneer Tikka (6 pc)", description: "Smoky cottage cheese, bell peppers", price: 219, isVeg: true },
        ],
      },
      {
        category: "Sides & Desserts",
        items: [
          { name: "Mirchi ka Salan", description: "Hyderabadi peanut-chilli curry", price: 89, isVeg: true },
          { name: "Double ka Meetha", description: "Bread pudding with saffron & nuts", price: 99, isVeg: true },
        ],
      },
    ],
  },
  {
    name: "Dosa Junction",
    description: "Crisp, golden dosas and filter coffee — South Indian comfort done right.",
    cuisines: ["South Indian", "Dosa", "Coffee"],
    rating: 4.6,
    ratingCount: 3892,
    address: "22, 100 Feet Road, Koramangala, Bengaluru",
    lat: 12.9347,
    lng: 77.6145,
    image: img("photo-1630383249896-424e482df921"),
    deliveryTimeMins: 25,
    deliveryFeePaise: 2900,
    featured: true,
    menu: [
      {
        category: "Dosas",
        items: [
          { name: "Masala Dosa", description: "Crisp crepe, potato masala, chutneys & sambar", price: 129, isVeg: true, popular: true },
          { name: "Ghee Podi Dosa", description: "Loaded with podi and clarified butter", price: 149, isVeg: true, popular: true },
          { name: "Mysore Masala Dosa", description: "Spicy red chutney smear, potato filling", price: 139, isVeg: true },
          { name: "Cheese Dosa", description: "Melted cheese, herbed butter", price: 159, isVeg: true },
        ],
      },
      {
        category: "Tiffin",
        items: [
          { name: "Idli Vada (2+2)", description: "Steamed idlis, crisp vadas, sambar", price: 99, isVeg: true },
          { name: "Rava Upma", description: "Roasted semolina, curry leaves, cashews", price: 89, isVeg: true },
        ],
      },
      {
        category: "Beverages",
        items: [
          { name: "Filter Coffee", description: "Frothy South Indian kaapi", price: 49, isVeg: true, popular: true },
          { name: "Sweet Lassi", description: "Thick, chilled, topped with malai", price: 79, isVeg: true },
        ],
      },
    ],
  },
  {
    name: "Pizza Culture",
    description: "Wood-fired Neapolitan pizzas with a blistered crust and honest toppings.",
    cuisines: ["Italian", "Pizza", "Pasta"],
    rating: 4.3,
    ratingCount: 1975,
    address: "5, Church Street, Bengaluru",
    lat: 12.9749,
    lng: 77.6099,
    image: img("photo-1565299624946-b28f40a0ae38"),
    deliveryTimeMins: 38,
    deliveryFeePaise: 4900,
    featured: true,
    menu: [
      {
        category: "Pizzas",
        items: [
          { name: "Margherita (10\")", description: "San Marzano tomato, fior di latte, basil", price: 299, isVeg: true, popular: true },
          { name: "Pepperoni Blaze (10\")", description: "Double pepperoni, hot honey drizzle", price: 399, isVeg: false, popular: true },
          { name: "Farmhouse Veggie (10\")", description: "Grilled peppers, mushrooms, olives, corn", price: 349, isVeg: true },
          { name: "Paneer Tikka Pizza (10\")", description: "Tandoori paneer, onion, mint yogurt", price: 379, isVeg: true },
        ],
      },
      {
        category: "Pasta & Sides",
        items: [
          { name: "Alfredo Penne", description: "Creamy garlic parmesan sauce", price: 289, isVeg: true },
          { name: "Garlic Breadsticks (6 pc)", description: "Butter, garlic, oregano, cheese dip", price: 149, isVeg: true },
        ],
      },
      {
        category: "Desserts",
        items: [
          { name: "Chocolate Brownie", description: "Warm, fudgy, with vanilla ice cream", price: 129, isVeg: true },
        ],
      },
    ],
  },
  {
    name: "Wok & Roll",
    description: "Wok-tossed noodles, momos and fiery Asian bowls with a street-food soul.",
    cuisines: ["Chinese", "Asian", "Momos"],
    rating: 4.1,
    ratingCount: 1422,
    address: "40, 12th Main, HSR Layout, Bengaluru",
    lat: 12.9121,
    lng: 77.6446,
    image: img("photo-1585032226651-759b368d7246"),
    deliveryTimeMins: 30,
    deliveryFeePaise: 3400,
    featured: true,
    menu: [
      {
        category: "Momos",
        items: [
          { name: "Steamed Chicken Momos (8 pc)", description: "Juicy filling, spicy chutney", price: 149, isVeg: false, popular: true },
          { name: "Veg Kurkure Momos (8 pc)", description: "Crispy fried, schezwan dip", price: 139, isVeg: true },
        ],
      },
      {
        category: "Wok Bowls",
        items: [
          { name: "Chilli Garlic Noodles", description: "Hand-pulled noodles, wok hei", price: 199, isVeg: false, popular: true },
          { name: "Veg Hakka Noodles", description: "Classic street-style hakka", price: 169, isVeg: true },
          { name: "Chicken Fried Rice", description: "Smoky rice, egg, scallions", price: 209, isVeg: false },
        ],
      },
      {
        category: "Starters",
        items: [
          { name: "Crispy Chilli Babycorn", description: "Sweet-spicy glaze, sesame", price: 179, isVeg: true },
          { name: "Dynamite Prawns (6 pc)", description: "Sriracha mayo, panko crust", price: 289, isVeg: false },
        ],
      },
    ],
  },
  {
    name: "Burger Barn",
    description: "Smash burgers, loaded fries and thick shakes — no shortcuts, ever.",
    cuisines: ["Burgers", "Fast Food", "Shakes"],
    rating: 4.2,
    ratingCount: 2651,
    address: "71, 4th Block, Jayanagar, Bengaluru",
    lat: 12.9254,
    lng: 77.5837,
    image: img("photo-1568901346375-23c9450c58cd"),
    deliveryTimeMins: 27,
    deliveryFeePaise: 2900,
    featured: true,
    menu: [
      {
        category: "Burgers",
        items: [
          { name: "Classic Smash Burger", description: "Double smashed patty, american cheese", price: 249, isVeg: false, popular: true },
          { name: "Crispy Chicken Burger", description: "Buttermilk fried chicken, slaw, sriracha mayo", price: 219, isVeg: false, popular: true },
          { name: "Aloo Tikki Burger", description: "Spiced potato patty, mint chutney", price: 129, isVeg: true },
          { name: "Veggie Crunch Burger", description: "Corn & peas patty, chipotle sauce", price: 159, isVeg: true },
        ],
      },
      {
        category: "Sides",
        items: [
          { name: "Peri-Peri Fries", description: "Crispy fries, peri-peri dust", price: 119, isVeg: true, popular: true },
          { name: "Loaded Cheese Fries", description: "Nacho cheese, jalapeños, spring onion", price: 179, isVeg: true },
        ],
      },
      {
        category: "Shakes",
        items: [
          { name: "Oreo Thick Shake", description: "Blended with real Oreo", price: 169, isVeg: true },
          { name: "Salted Caramel Shake", description: "House caramel, sea salt", price: 179, isVeg: true },
        ],
      },
    ],
  },
  {
    name: "Tandoor Tales",
    description: "Butter chicken, naans and kebabs from a clay-tandoor kitchen.",
    cuisines: ["North Indian", "Tandoori", "Curry"],
    rating: 4.5,
    ratingCount: 3108,
    address: "9, Cunningham Road, Bengaluru",
    lat: 12.9852,
    lng: 77.5914,
    image: img("photo-1601050690597-df0568f70950"),
    deliveryTimeMins: 35,
    deliveryFeePaise: 3900,
    featured: true,
    menu: [
      {
        category: "Mains",
        items: [
          { name: "Butter Chicken", description: "Silky tomato-makhani gravy, tandoori chicken", price: 329, isVeg: false, popular: true },
          { name: "Paneer Butter Masala", description: "Cottage cheese in rich makhani", price: 279, isVeg: true, popular: true },
          { name: "Dal Makhani", description: "Black lentils simmered overnight", price: 229, isVeg: true },
        ],
      },
      {
        category: "Breads",
        items: [
          { name: "Garlic Butter Naan", description: "Blistered naan, garlic, butter", price: 69, isVeg: true, popular: true },
          { name: "Tandoori Roti", description: "Whole wheat, smoky", price: 39, isVeg: true },
        ],
      },
      {
        category: "Starters",
        items: [
          { name: "Malai Chicken Tikka (6 pc)", description: "Creamy, mildly spiced, char-grilled", price: 269, isVeg: false },
          { name: "Hara Bhara Kebab (6 pc)", description: "Spinach & pea patties", price: 189, isVeg: true },
        ],
      },
    ],
  },
  {
    name: "Green Bowl Co.",
    description: "Rainbow salads, grain bowls and cold-pressed goodness for clean eating.",
    cuisines: ["Salads", "Healthy", "Bowls"],
    rating: 4.0,
    ratingCount: 864,
    address: "120, Inner Ring Road, Bellandur, Bengaluru",
    lat: 12.9305,
    lng: 77.6784,
    image: img("photo-1546069901-ba9599a7e63c"),
    deliveryTimeMins: 24,
    deliveryFeePaise: 2400,
    menu: [
      {
        category: "Bowls",
        items: [
          { name: "Harvest Grain Bowl", description: "Quinoa, roasted veggies, tahini", price: 269, isVeg: true, popular: true },
          { name: "Chicken Caesar Bowl", description: "Grilled chicken, romaine, parmesan", price: 299, isVeg: false },
          { name: "Poke-style Tofu Bowl", description: "Marinated tofu, edamame, sesame", price: 279, isVeg: true },
        ],
      },
      {
        category: "Salads & Sides",
        items: [
          { name: "Classic Greek Salad", description: "Feta, olives, cucumber, oregano", price: 219, isVeg: true },
          { name: "Sweet Potato Wedges", description: "Smoked paprika, garlic aioli", price: 149, isVeg: true },
        ],
      },
      {
        category: "Juices",
        items: [
          { name: "Green Detox (500ml)", description: "Spinach, apple, ginger, lemon", price: 129, isVeg: true },
          { name: "Watermelon Cooler (500ml)", description: "Fresh pressed, mint", price: 99, isVeg: true },
        ],
      },
    ],
  },
  {
    name: "Momo House",
    description: "Steamy Nepali-style momos with three kinds of chutney, served till late.",
    cuisines: ["Momos", "Nepali", "Tibetan"],
    rating: 4.3,
    ratingCount: 1547,
    address: "3, 5th Cross, Malleshwaram, Bengaluru",
    lat: 13.0045,
    lng: 77.5709,
    image: img("photo-1541518763669-27fef04b14ea"),
    deliveryTimeMins: 28,
    deliveryFeePaise: 2900,
    menu: [
      {
        category: "Momos",
        items: [
          { name: "Steamed Veg Momos (10 pc)", description: "Cabbage-carrot filling, tomato chutney", price: 119, isVeg: true, popular: true },
          { name: "Chicken Steam Momos (10 pc)", description: "Minced chicken, ginger-scallion", price: 149, isVeg: false, popular: true },
          { name: "Fried Chicken Momos (8 pc)", description: "Golden fried, chilli oil", price: 169, isVeg: false },
          { name: "Paneer Momos (8 pc)", description: "Cottage cheese, spring onion", price: 139, isVeg: true },
        ],
      },
      {
        category: "Mains",
        items: [
          { name: "Thenthuk Noodle Soup", description: "Hand-pulled noodles, veggies, broth", price: 199, isVeg: false },
          { name: "Veg Thukpa", description: "Tibetan noodle soup", price: 169, isVeg: true },
        ],
      },
      {
        category: "Beverages",
        items: [
          { name: "Masala Lemon Tea", description: "Spiced, tangy, warming", price: 79, isVeg: true },
        ],
      },
    ],
  },
  {
    name: "Sweet Cravings",
    description: "Desserts, brownies and midnight shakes for the sweet tooth that never sleeps.",
    cuisines: ["Desserts", "Bakery", "Shakes"],
    rating: 4.4,
    ratingCount: 1233,
    address: "88, Residency Road, Bengaluru",
    lat: 12.9711,
    lng: 77.5994,
    image: img("photo-1551024506-0bccd828d307"),
    deliveryTimeMins: 22,
    deliveryFeePaise: 2400,
    menu: [
      {
        category: "Desserts",
        items: [
          { name: "Molten Lava Cake", description: "Dark chocolate, vanilla bean ice cream", price: 149, isVeg: true, popular: true },
          { name: "New York Cheesecake", description: "Baked, berry compote", price: 199, isVeg: true },
          { name: "Gulab Jamun Cheesecake", description: "Our signature fusion", price: 219, isVeg: true, popular: true },
        ],
      },
      {
        category: "Shakes",
        items: [
          { name: "Nutella Hazelnut Shake", description: "Thick, indulgent, topped with Nutella", price: 189, isVeg: true, popular: true },
          { name: "KitKat Crunch Shake", description: "Chocolate, wafer, whipped cream", price: 189, isVeg: true },
        ],
      },
      {
        category: "Bakery",
        items: [
          { name: "Chocolate Chip Cookies (4 pc)", description: "Chewy, gooey, baked hourly", price: 119, isVeg: true },
          { name: "Blueberry Muffin", description: "Buttery, bursting with berries", price: 99, isVeg: true },
        ],
      },
    ],
  },
];

export const seedDemoData = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("restaurants").first();
    if (existing) {
      return {
        seeded: false,
        message: "Marketplace already seeded",
        restaurants: 0,
        orders: 0,
      };
    }

    const now = Date.now();
    const DAY = 86_400_000;
    let orderCount = 0;

    // --- restaurants + menus -------------------------------------------------
    for (const r of RESTAURANTS) {
      const restaurantId = await ctx.db.insert("restaurants", {
        name: r.name,
        description: r.description,
        cuisines: r.cuisines,
        rating: r.rating,
        ratingCount: r.ratingCount,
        address: r.address,
        latitude: r.lat,
        longitude: r.lng,
        isOpen: true,
        imageUrl: r.image,
        deliveryTimeMins: r.deliveryTimeMins,
        deliveryFeePaise: r.deliveryFeePaise,
        isFeatured: r.featured ?? false,
        isArchived: false,
        createdAt: now,
      });
      for (const group of r.menu) {
        for (const item of group.items) {
          await ctx.db.insert("menuItems", {
            restaurantId,
            name: item.name,
            description: item.description,
            category: group.category,
            pricePaise: item.price * 100,
            isVeg: item.isVeg,
            isAvailable: true,
            isPopular: item.popular ?? false,
            createdAt: now,
          });
        }
      }
    }

    // --- coupons ---------------------------------------------------------------
    await ctx.db.insert("coupons", {
      code: "WELCOME50",
      discountType: "FLAT",
      discountValuePaise: 5000,
      minOrderPaise: 19900,
      isActive: true,
      createdAt: now,
    });
    await ctx.db.insert("coupons", {
      code: "SAVE20",
      discountType: "PERCENT",
      discountValuePaise: 20,
      minOrderPaise: 29900,
      maxDiscountPaise: 12000,
      isActive: true,
      createdAt: now,
    });
    await ctx.db.insert("coupons", {
      code: "QBFREE",
      discountType: "FLAT",
      discountValuePaise: 4900,
      minOrderPaise: 39900,
      isActive: true,
      createdAt: now,
    });

    // --- demo customer + 14 days of history for admin analytics -----------------
    const restaurants = await ctx.db.query("restaurants").collect();
    const menuByRestaurant: Record<
      string,
      { id: Id<"menuItems">; name: string; pricePaise: number; isVeg: boolean }[]
    > = {};
    for (const r of restaurants) {
      const items = await ctx.db
        .query("menuItems")
        .withIndex("by_restaurant", (q) => q.eq("restaurantId", r._id))
        .collect();
      menuByRestaurant[r._id] = items.map((i) => ({
        id: i._id,
        name: i.name,
        pricePaise: i.pricePaise,
        isVeg: i.isVeg,
      }));
    }

    const customerId = await ctx.db.insert("users", {
      name: "Riya Sharma",
      email: "demo@quickbite.app",
      role: ROLES.CUSTOMER,
      status: "ACTIVE",
      phone: "+91 98765 43210",
      isAnonymous: false,
    });
    const addressId = await ctx.db.insert("addresses", {
      userId: customerId,
      label: "Home",
      fullAddress: "B-204, Sunshine Apartments, Koramangala 5th Block, Bengaluru 560095",
      latitude: 12.9347,
      longitude: 77.6145,
      isDefault: true,
      createdAt: now,
    });

    const seededStatuses = ["DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "OUT_FOR_DELIVERY", "DELIVERED", "ACCEPTED", "DELIVERED", "PENDING"] as const;

    for (let day = 13; day >= 0; day--) {
      const ordersToday = 1 + ((day * 7) % 3); // 1–3 orders per day
      for (let k = 0; k < ordersToday; k++) {
        const r = restaurants[(day * 3 + k * 5) % restaurants.length];
        const menu = menuByRestaurant[r._id];
        if (!menu?.length) continue;
        const picked = [...menu].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
        const items = picked.map((i, idx) => ({
          menuItemId: i.id,
          name: i.name,
          quantity: 1 + (idx % 2),
          pricePaise: i.pricePaise,
          isVeg: i.isVeg,
        }));
        const subtotal = items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
        const createdAt = now - day * DAY - k * 3_600_000 - Math.floor(Math.random() * 3_000_000);
        const status = seededStatuses[(day + k) % seededStatuses.length];
        const deliveredAt = status === "DELIVERED" ? createdAt + 45 * 60_000 : undefined;
        const total = subtotal + r.deliveryFeePaise;

        const history: { status: OrderStatus; at: number }[] = [{ status: "PENDING", at: createdAt }];
        if (status === "ACCEPTED") history.push({ status: "ACCEPTED" as const, at: createdAt + 4 * 60_000 });
        if (status === "OUT_FOR_DELIVERY") {
          history.push(
            { status: "ACCEPTED" as const, at: createdAt + 4 * 60_000 },
            { status: "PREPARING" as const, at: createdAt + 8 * 60_000 },
            { status: "READY" as const, at: createdAt + 14 * 60_000 },
            { status: "ASSIGNED" as const, at: createdAt + 17 * 60_000 },
            { status: "PICKED_UP" as const, at: createdAt + 26 * 60_000 },
            { status: "OUT_FOR_DELIVERY" as const, at: createdAt + 30 * 60_000 },
          );
        }
        if (status === "DELIVERED") {
          history.push(
            { status: "ACCEPTED" as const, at: createdAt + 4 * 60_000 },
            { status: "PREPARING" as const, at: createdAt + 8 * 60_000 },
            { status: "READY" as const, at: createdAt + 14 * 60_000 },
            { status: "ASSIGNED" as const, at: createdAt + 17 * 60_000 },
            { status: "PICKED_UP" as const, at: createdAt + 26 * 60_000 },
            { status: "OUT_FOR_DELIVERY" as const, at: createdAt + 30 * 60_000 },
            { status: "DELIVERED" as const, at: deliveredAt! },
          );
        }

        await ctx.db.insert("orders", {
          customerId,
          customerName: "Riya Sharma",
          restaurantId: r._id,
          restaurantName: r.name,
          restaurantLat: r.latitude,
          restaurantLng: r.longitude,
          addressId,
          addressLabel: "Home",
          addressFull: "B-204, Sunshine Apartments, Koramangala 5th Block, Bengaluru 560095",
          addressLat: 12.9347,
          addressLng: 77.6145,
          items,
          subtotalPaise: subtotal,
          deliveryFeePaise: r.deliveryFeePaise,
          discountPaise: 0,
          totalPaise: total,
          paymentStatus: "PAID",
          paymentMethod: "UPI",
          orderStatus: status,
          statusHistory: history,
          deliveredAt,
          createdAt,
        });
        orderCount++;
      }
    }

    return {
      seeded: true,
      message: "Marketplace seeded 🎉",
      restaurants: restaurants.length,
      orders: orderCount,
    };
  },
});
