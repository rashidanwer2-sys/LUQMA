// ======================================================
// LUQMA WEEKLY CONTROL FILE
// Edit only this file before each Sunday.
// ======================================================

const LUQMA_CONFIG = {
  shopOpen: true,
  menuName: "Sunday Special",
  orderWhatsApp: "918386839883",

  // Paste your WhatsApp group invite link below later.
  whatsappGroupLink: "",

  // PAYMENT SETTINGS - placeholders for testing only
  upiId: "luqma.demo@upi",
  upiPayeeName: "LUQMA Little Bites",

  items: [
    {
      id: "CB01",
      image: "https://images.pexels.com/photos/9609860/pexels-photo-9609860.jpeg?auto=compress&cs=tinysrgb&w=1200&fit=crop",
      name: "Chicken Dum Biryani",
      description: "Aromatic dum biryani served with raita and fresh salad.",
      price: 220,
      quantity: 15,
      active: true
    },
    {
      id: "MB01",
      image: "https://images.pexels.com/photos/20446397/pexels-photo-20446397.jpeg?auto=compress&cs=tinysrgb&w=1200&fit=crop",
      name: "Mutton Dum Biryani",
      description: "Slow-cooked mutton dum biryani served with raita and salad.",
      price: 280,
      quantity: 10,
      active: true
    },
    {
      id: "CK01",
      image: "https://images.pexels.com/photos/6089832/pexels-photo-6089832.jpeg?auto=compress&cs=tinysrgb&w=1200&fit=crop",
      name: "Chicken Kebab",
      description: "Juicy homemade chicken kebabs, freshly prepared in small batches.",
      price: 180,
      quantity: 8,
      active: true
    },
    {
      id: "MK01",
      image: "https://images.pexels.com/photos/15058960/pexels-photo-15058960.jpeg?auto=compress&cs=tinysrgb&w=1200&fit=crop",
      name: "Mutton Kebab",
      description: "Rich, flavourful homemade mutton kebabs.",
      price: 220,
      quantity: 6,
      active: false
    },
    {
      id: "MC01",
      image: "https://images.pexels.com/photos/10615283/pexels-photo-10615283.jpeg?auto=compress&cs=tinysrgb&w=1200&fit=crop",
      name: "Malai Chicken + Paratha",
      description: "Creamy malai chicken served with soft paratha and salad.",
      price: 240,
      quantity: 8,
      active: false
    }

    // Add more menu items here. Keep active:false when not needed.
  ]
};
