import unittest
from pathlib import Path
from shutil import rmtree
from unittest.mock import patch


from app.schemas.match import MatchDimension
from app.utils.hashing import md5_text
from app.utils.storage import build_resume_pdf_path, save_resume_pdf
from app.utils.text import clean_resume_text
from app.utils.matching import calculate_match_score


class ResumeDomainTestCase(unittest.TestCase):
    def test_clean_resume_text_removes_noise_and_normalizes_sections(self) -> None:
        dirty_text = "  张三  \n\n求 职 意 向 ： Python开发工程师\t\t@@@\n\x00电话：13800000000  "

        cleaned = clean_resume_text(dirty_text)

        self.assertEqual(cleaned, "张三\n求职意向: Python开发工程师\n电话: 13800000000")

    def test_md5_text_is_stable(self) -> None:
        payload = "同一份简历文本"

        self.assertEqual(md5_text(payload), md5_text(payload))
        self.assertEqual(len(md5_text(payload)), 32)

    def test_calculate_match_score_uses_weighted_dimensions(self) -> None:
        score, summary = calculate_match_score(
            skill_dimension=MatchDimension(score=92, matched=["FastAPI", "Redis"], missing=["Kubernetes"]),
            experience_dimension=MatchDimension(score=80, matched=["5年后端经验"], missing=[]),
            education_dimension=MatchDimension(score=75, matched=["本科"], missing=[]),
        )

        self.assertEqual(score, 85)
        self.assertIn("技能匹配表现突出", summary[0])

    def test_save_resume_pdf_persists_uploaded_file_by_hash(self) -> None:
        temp_dir = Path("tests/.tmp-storage-save")
        temp_dir.mkdir(parents=True, exist_ok=True)
        try:
            with patch("app.utils.storage.get_resume_storage_dir", return_value=temp_dir):
                saved_path = save_resume_pdf("hash123", b"%PDF-demo")

                self.assertTrue(saved_path.exists())
                self.assertEqual(saved_path.name, "hash123.pdf")
                self.assertEqual(saved_path.read_bytes(), b"%PDF-demo")
        finally:
            rmtree(temp_dir, ignore_errors=True)

    def test_build_resume_pdf_path_uses_hash_filename(self) -> None:
        temp_dir = Path("tests/.tmp-storage-path")
        temp_dir.mkdir(parents=True, exist_ok=True)
        try:
            with patch("app.utils.storage.get_resume_storage_dir", return_value=temp_dir):
                target = build_resume_pdf_path("abc")

                self.assertEqual(target.name, "abc.pdf")
        finally:
            rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
