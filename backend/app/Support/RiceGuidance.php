<?php

namespace App\Support;

class RiceGuidance
{
    public static function for(?string $condition, ?string $food, ?string $question = null): ?array
    {
        $text = strtolower(trim((string) $food . ' ' . (string) $question));

        if (! preg_match('/\brice\b|ارز|أرز|رز/u', $text)) {
            return null;
        }

        $conditionText = strtolower(trim((string) $condition));
        $hasDiabetes = str_contains($conditionText, 'diabetes')
            || str_contains($conditionText, 'diabetic')
            || str_contains($conditionText, 'سكري')
            || str_contains($conditionText, 'السكري');

        if ($hasDiabetes) {
            $isBrownRice = preg_match('/\bbrown\s+rice\b|\brice\s+brown\b|ارز بني|أرز بني|رز بني/u', $text);

            return [
                'status' => $isBrownRice ? 'allowed' : 'avoid',
                'message' => 'Only brown rice is allowed for you.',
                'reason' => 'For diabetes, choose brown rice instead of other rice types.',
            ];
        }

        return [
            'status' => 'allowed',
            'message' => 'All rice types are allowed.',
            'reason' => 'Rice is allowed for this health goal.',
        ];
    }
}
