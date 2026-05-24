"""
End-to-end Playwright test: upload → thumbnail → generate recipe flow.

Runs against a live Next.js dev server. Mocks /api/analyze so the test
works offline and doesn't burn OpenRouter credits.

Run:
    python3 __tests__/e2e/upload_flow.py
"""

import os

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright, expect

# 8×8 green JPEG generated via browser Canvas — verified browser-decodable
FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "test_image.jpg")

# SSE payload that mimics a single OpenRouter streaming response
SSE_RECIPE = (
    'data: {"id":"test","choices":[{"delta":{"content":"## Test Recipe\\n\\nUse your ingredients wisely."}}]}\n\n'
    "data: [DONE]\n\n"
)

BASE_URL = "http://localhost:3000"
ALT = "Ingredient photo"  # ImagePreview renders alt="Ingredient photo {n}"


def fresh_page(browser: Browser, mock_analyze=True) -> Page:
    """New isolated context + page with optional /api/analyze mock."""
    ctx: BrowserContext = browser.new_context()
    page: Page = ctx.new_page()
    if mock_analyze:
        page.route("**/api/analyze", lambda r, _: r.fulfill(
            status=200,
            headers={"Content-Type": "text/event-stream"},
            body=SSE_RECIPE,
        ))
    page.goto(BASE_URL, wait_until="networkidle", timeout=15000)
    return page


def upload_fixture(page: Page) -> None:
    """Click Upload, select the test JPEG, wait for the thumbnail to appear."""
    with page.expect_file_chooser(timeout=5000) as fc:
        page.get_by_role("button", name="📁 Upload").click()
    fc.value.set_files(FIXTURE)
    page.wait_for_selector(f"img[alt='{ALT} 1']", timeout=8000)


def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        passed = failed = 0

        def ok(name: str):
            nonlocal passed
            passed += 1
            print(f"  ✓ {name}")

        def fail(name: str, err, errors=None):
            nonlocal failed
            failed += 1
            print(f"  ✗ {name}: {err}")
            if errors:
                print(f"    [console errors] {errors[-3:]}")

        # ------------------------------------------------------------------
        # 1–7: Baseline flow — share one page so we can chain state
        # ------------------------------------------------------------------
        page = fresh_page(browser)
        errors: list[str] = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))

        # 1. Page loads
        try:
            expect(page.get_by_role("heading", name="PantryLens", exact=True)).to_be_visible()
            expect(page.get_by_text("Snap your fridge. Get a recipe.")).to_be_visible()
            ok("page loads with correct title and subtitle")
        except Exception as e:
            fail("page loads with correct title and subtitle", e, errors)

        # 2. Generate disabled before upload
        try:
            expect(page.get_by_role("button", name="✨ Generate Recipe")).to_be_disabled()
            ok("Generate Recipe disabled with no images")
        except Exception as e:
            fail("Generate Recipe disabled with no images", e, errors)

        # 3. All controls visible
        try:
            expect(page.get_by_text("Drop photos here")).to_be_visible()
            expect(page.get_by_role("button", name="📷 Camera")).to_be_visible()
            expect(page.get_by_role("button", name="📁 Upload")).to_be_visible()
            ok("Drop zone, Camera, and Upload buttons visible")
        except Exception as e:
            fail("Drop zone, Camera, and Upload buttons visible", e, errors)

        # 4. Clicking Upload opens file chooser
        try:
            with page.expect_file_chooser(timeout=5000):
                page.get_by_role("button", name="📁 Upload").click()
            ok("clicking Upload opens file chooser")
        except Exception as e:
            fail("clicking Upload opens file chooser", e, errors)

        # 5. Upload produces thumbnail — use fresh page (test 4 left chooser open)
        page5 = fresh_page(browser)
        try:
            with page5.expect_file_chooser(timeout=5000) as fc:
                page5.get_by_role("button", name="📁 Upload").click()
            fc.value.set_files(FIXTURE)
            page5.wait_for_selector(f"img[alt='{ALT} 1']", timeout=8000)
            expect(page5.locator(f"img[alt='{ALT} 1']")).to_be_visible()
            ok("uploading an image shows a thumbnail")
        except Exception as e:
            fail("uploading an image shows a thumbnail", e)

        # 6. Generate enabled after upload (still on page5)
        try:
            expect(page5.get_by_role("button", name="✨ Generate Recipe")).to_be_enabled()
            ok("Generate Recipe enabled after upload")
        except Exception as e:
            fail("Generate Recipe enabled after upload", e)

        # 7. Generate Recipe streams content (still on page5)
        try:
            page5.get_by_role("button", name="✨ Generate Recipe").click()
            page5.wait_for_selector("text=Test Recipe", timeout=8000)
            expect(page5.get_by_text("Test Recipe")).to_be_visible()
            ok("Generate Recipe streams recipe content to the page")
        except Exception as e:
            fail("Generate Recipe streams recipe content to the page", e)

        # ------------------------------------------------------------------
        # 8. 3-image cap — fresh isolated page
        # ------------------------------------------------------------------
        try:
            p8 = fresh_page(browser)
            for i in range(3):
                with p8.expect_file_chooser(timeout=5000) as fc:
                    p8.get_by_role("button", name="📁 Upload").click()
                fc.value.set_files(FIXTURE)
                p8.wait_for_selector(f"img[alt='{ALT} {i + 1}']", timeout=8000)
            expect(p8.get_by_text("Maximum 3 images added")).to_be_visible()
            ok("3-image cap shows helper text")
        except Exception as e:
            fail("3-image cap shows helper text", e)

        # ------------------------------------------------------------------
        # 9. Camera button opens file chooser — fresh page
        # ------------------------------------------------------------------
        try:
            p9 = fresh_page(browser)
            with p9.expect_file_chooser(timeout=5000):
                p9.get_by_role("button", name="📷 Camera").click()
            ok("clicking Camera opens file chooser")
        except Exception as e:
            fail("clicking Camera opens file chooser", e)

        # ------------------------------------------------------------------
        # 10. 429 shows error — fresh page with 429 mock
        # ------------------------------------------------------------------
        try:
            p10: BrowserContext = browser.new_context()
            pg10: Page = p10.new_page()
            pg10.route("**/api/analyze", lambda r, _: r.fulfill(
                status=429, body="You've reached the hourly limit. Please try again later."
            ))
            pg10.goto(BASE_URL, wait_until="networkidle")
            upload_fixture(pg10)
            pg10.get_by_role("button", name="✨ Generate Recipe").click()
            pg10.wait_for_selector("text=hourly limit", timeout=8000)
            expect(pg10.get_by_text("hourly limit", exact=False)).to_be_visible()
            ok("429 response shows rate-limit error to user")
        except Exception as e:
            fail("429 response shows rate-limit error to user", e)

        # ------------------------------------------------------------------
        # 11. Remove button deletes thumbnail — fresh page
        # ------------------------------------------------------------------
        try:
            p11 = fresh_page(browser)
            upload_fixture(p11)
            p11.locator(f"img[alt='{ALT} 1']").hover()
            p11.get_by_label("Remove photo 1").click()
            p11.wait_for_function(
                f"document.querySelectorAll('img[alt^=\"{ALT}\"]').length === 0",
                timeout=5000,
            )
            ok("remove button deletes the thumbnail")
        except Exception as e:
            fail("remove button deletes the thumbnail", e)

        browser.close()

        print()
        total = passed + failed
        print(f"Results: {passed}/{total} passed  {'🎉' if not failed else '❌'}")
        if failed:
            raise SystemExit(1)


if __name__ == "__main__":
    run_tests()
