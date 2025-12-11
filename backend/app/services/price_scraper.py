from typing import Optional
import re

import httpx
from bs4 import BeautifulSoup

VEG_URL = "https://vegetablemarketprice.com/market/kerala/today"
FRUIT_URL = "https://vegetablemarketprice.com/fruits/kerala/today"


async def fetch_html(url: str) -> str:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.text


def scrape_price_from_text(html: str, produce_name: str) -> Optional[float]:
    """
    Look through the full page text and find a pattern like:

        Tomato  ₹50
        Onion Big  ₹28
        Banana  ₹35

    We use a regular expression to capture the number after the '₹' symbol.
    """
    soup = BeautifulSoup(html, "html.parser")
    # Get all text in one big string (spaces instead of newlines are fine)
    text = soup.get_text(" ")

    # Build a case-insensitive regex pattern:
    #   "{produce_name}   ₹   <number>"
    #
    # Example for Tomato:
    #   r"Tomato\s*₹\s*([0-9]+(?:\.[0-9]+)?)"
    #
    pattern = rf"{re.escape(produce_name.strip())}\s*₹\s*([0-9]+(?:\.[0-9]+)?)"

    match = re.search(pattern, text, flags=re.IGNORECASE)
    if not match:
        return None

    price_str = match.group(1)  # the captured number, e.g. "50" or "50.5"
    try:
        return float(price_str)
    except ValueError:
        return None


async def get_current_market_price(produce_name: str) -> Optional[float]:
    """
    Try to find the price on the Kerala vegetable page first,
    then on the Kerala fruits page.
    """
    # Try vegetables page
    html = await fetch_html(VEG_URL)
    price = scrape_price_from_text(html, produce_name)
    if price is not None:
        return price

    # Try fruits page
    html = await fetch_html(FRUIT_URL)
    price = scrape_price_from_text(html, produce_name)
    if price is not None:
        return price

    return None


# if __name__ == "__main__":
#     import asyncio

#     async def test():
#         for name in ["Tomato", "Onion Big", "Banana"]:
#             p = await get_current_market_price(name)
#             print(f"{name!r} price:", p)

#     asyncio.run(test())
#rehenmanoy