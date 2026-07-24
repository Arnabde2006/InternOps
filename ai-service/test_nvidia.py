import asyncio
from app.providers.nvidia import call_nvidia

async def main():
    print("Sending message to Nvidia NIM...")
    messages = [{"role": "user", "content": "Hello! Give me a 1 sentence greeting."}]
    try:
        response = await call_nvidia(messages)
        print("Nvidia Response:", response)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
