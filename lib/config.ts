export const shop = {
  name: "Voyage Advent",
  phone: "+254 717 758 035",
  whatsapp: "254717758035",
  email: "voyageadvent@gmail.com",
  instagram: "https://www.instagram.com/voyage_advent/",
};
export const whatsappUrl = (
  message = "Hello Voyage Advent, I would like some help choosing a bottle.",
) => `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(message)}`;
export const money = (value: number) => `KSh ${value.toLocaleString("en-KE")}`;
