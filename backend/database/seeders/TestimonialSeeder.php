<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Testimonial;   // ✅ correct import

class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        Testimonial::create([
            'name' => 'Aisha',
            'quote' => 'Tayibat helped me feel lighter and more energized.',
            'image' => null,
        ]);

        Testimonial::create([
            'name' => 'Omar',
            'quote' => 'The AI chatbot answered my diet questions instantly.',
            'image' => null,
        ]);
        Testimonial::create([
            'name' => 'bilal',
            'quote' => 'The AI chatbot answered my diet questions instantly.',
            'image' => null,
        ]);
    }
}
